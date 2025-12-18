"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import enTranslations from "@/locales/en.json";
import zhTranslations from "@/locales/zh.json";

type Language = "en" | "zh";
type Translations = typeof enTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
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
  const supabase = createClient();

  // Load language from profile on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", user.id)
          .single();

        if (profile?.language) {
          setLanguageState(profile.language as Language);
        }
      } catch (error) {
        console.error("Error loading language:", error);
      }
    };

    loadLanguage();
  }, [supabase]);

  const setLanguage = async (lang: Language) => {
    try {
      // Update state first for immediate UI response
      setLanguageState(lang);

      // Save to profile in database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found, cannot save language preference");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          language: lang,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving language to database:", error);
        throw error;
      }

      console.log("Language successfully updated to:", lang);
    } catch (error) {
      console.error("Error in setLanguage:", error);
      // Optionally revert state if database update fails
      // setLanguageState(previous language);
    }
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations[language] }}
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
