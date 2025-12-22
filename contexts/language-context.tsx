"use client";

import React, { createContext, useContext, useMemo } from "react";
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
  const { user, loading } = useUser();
  const supabase = createClient();

  // ✅ derive language instead of effect
  const language: Language =
    (user?.profileSettings?.language as Language) ?? "en";

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = async (lang: Language) => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      await supabase
        .from("profiles")
        .update({
          language: lang,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);
    } catch (err) {
      console.error("setLanguage error:", err);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        loading,
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
