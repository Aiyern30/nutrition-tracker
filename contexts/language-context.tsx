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
  const { user, updateUserProfileSettings } = useUser();
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

        // Update in database (fire and forget - optimistic update is already done)
        await supabase.current
          .from("profiles")
          .update({
            language: lang,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        // No need to refresh - the optimistic update is sufficient
        // The next natural data load will sync from the database
      } catch (err) {
        console.error("setLanguage error:", err);
        // On error, the database update failed but optimistic update remains
        // This is acceptable - next page load will sync from database
      }
    },
    [updateUserProfileSettings]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        loading: false, // Never show loading since we use optimistic updates
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
