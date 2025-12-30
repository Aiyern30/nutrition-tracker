"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import enTranslations from "@/locales/en.json";
import zhTranslations from "@/locales/zh.json";
import { useUser } from "@/contexts/user-context";

type Language = "en" | "zh";
type Translations = typeof enTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  loading: boolean;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  zh: zhTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, initializing, refreshUser, updateUserProfileSettings } =
    useUser();
  const supabase = useRef(createClient());

  // derive language directly from user profile (no local state / cache)
  const language: Language =
    (user?.profileSettings?.language as Language) ?? "en";

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.current.auth.getUser();

        if (!authUser) return;

        // Optimistically update the language in the UI immediately
        updateUserProfileSettings({ language: lang });

        // Update in database
        const { error } = await supabase.current
          .from("profiles")
          .update({
            language: lang,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (error) {
          console.error("Error updating language:", error);
          // Revert optimistic update on error by refreshing from server
          await refreshUser();
          return;
        }

        // Refresh user context after a delay to ensure database consistency
        // The delay allows the database update to propagate and avoids race conditions
        // We already updated the UI optimistically, so this is just for consistency
        setTimeout(async () => {
          try {
            await refreshUser();
          } catch (err) {
            // If refresh fails, the optimistic update is still in place
            console.error("Error refreshing user after language update:", err);
          }
        }, 300);
      } catch (err) {
        console.error("setLanguage error:", err);
        // Revert optimistic update on error
        try {
          await refreshUser();
        } catch (refreshErr) {
          console.error("Error reverting language update:", refreshErr);
        }
      }
    },
    [refreshUser, updateUserProfileSettings]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        loading: initializing,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
