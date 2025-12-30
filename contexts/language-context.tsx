"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useCallback,
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

const LANGUAGE_CACHE_KEY = "language_cache";

// Helper to load cached language
const loadCachedLanguage = (): Language | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(LANGUAGE_CACHE_KEY);
    return (cached as Language) ?? null;
  } catch {
    return null;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, initializing, refreshUser } = useUser();
  const supabase = useRef(createClient());

  // initialize from cache or fallback to 'en'
  const initialLanguage: Language = (() => {
    const cached = loadCachedLanguage();
    if (cached) return cached;
    return "en";
  })();

  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // derive user language (may be null) and prefer it for rendering without calling setState in effects
  const userLang = (user?.profileSettings?.language as Language) ?? null;
  const effectiveLanguage: Language = (userLang ?? language) as Language;

  const t = useMemo(() => translations[effectiveLanguage], [effectiveLanguage]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      // Optimistic update + cache
      setLanguageState(lang);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(LANGUAGE_CACHE_KEY, lang);
      }

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
          const fallback =
            (user?.profileSettings?.language as Language) ?? "en";
          setLanguageState(fallback);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(LANGUAGE_CACHE_KEY, fallback);
          }
          return;
        }

        // refresh user to sync profile
        await refreshUser();
      } catch (err) {
        console.error("setLanguage error:", err);
        const fallback = (user?.profileSettings?.language as Language) ?? "en";
        setLanguageState(fallback);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(LANGUAGE_CACHE_KEY, fallback);
        }
      }
    },
    [refreshUser, user]
  );

  return (
    <LanguageContext.Provider
      value={{
        language: effectiveLanguage,
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
