"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [language, setLanguageState] = useState<Language>("en");
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  // Simply use the language from UserProvider - no need to fetch again!
  useEffect(() => {
    if (!userLoading && user?.profileSettings?.language) {
      setLanguageState(user.profileSettings.language as Language);
    }
  }, [user, userLoading]);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        console.error("No user found, cannot save language preference");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          language: lang,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (error) {
        console.error("Error saving language to database:", error);
        throw error;
      }

      console.log("Language successfully updated to:", lang);
    } catch (error) {
      console.error("Error in setLanguage:", error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        loading: userLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
