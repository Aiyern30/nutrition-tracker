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
  const { user, initializing, refreshUser } = useUser();
  const supabase = useRef(createClient());

  // derive language directly from user profile (no local state / cache)
  const language: Language = (user?.profileSettings?.language as Language) ?? "en";

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.current.auth.getUser();

        if (!authUser) return;

        const { error } = await supabase.current
          .from("profiles")
          .update({
            language: lang,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (error) {
          console.error("Error updating language:", error);
          return;
        }

        // refresh user context so derived language updates app-wide
        await refreshUser();
      } catch (err) {
        console.error("setLanguage error:", err);
      }
    },
    [refreshUser]
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
