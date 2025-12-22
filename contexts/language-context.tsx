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
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  // Load language from profile on mount, but wait for user to load
  useEffect(() => {
    const loadLanguage = async () => {
      // Wait for user context to finish loading
      if (userLoading) return;

      try {
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("language")
            .eq("id", user.email) // Use email or another identifier
            .single();

          if (profile?.language) {
            setLanguageState(profile.language as Language);
          }
        }
      } catch (error) {
        console.error("Error loading language:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, [supabase, user, userLoading]);

  const setLanguage = async (lang: Language) => {
    try {
      // Update state first for immediate UI response
      setLanguageState(lang);

      // Save to profile in database
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
      value={{ language, setLanguage, t: translations[language], loading }}
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
