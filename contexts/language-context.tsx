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
    return cached as Language | null;
  } catch {
    return null;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, initializing, refreshUser } = useUser();
  const supabase = useRef(createClient());
  const lastUserLanguageRef = useRef<Language | null>(null);

  // Get the current language from user profile
  const userProfileLanguage =
    (user?.profileSettings?.language as Language) ?? "en";

  // Initialize language state
  const [language, setLanguageState] = useState<Language>(() => {
    const cached = loadCachedLanguage();
    if (cached) return cached;
    return userProfileLanguage;
  });

  // Sync language when user profile language changes
  // Use a ref to track the last value and only update if it actually changed
  if (userProfileLanguage !== lastUserLanguageRef.current) {
    lastUserLanguageRef.current = userProfileLanguage;

    // Only update state if it's different from current language
    if (userProfileLanguage !== language) {
      // This is safe because it only happens during render phase
      // when the user data actually changes
      setLanguageState(userProfileLanguage);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(LANGUAGE_CACHE_KEY, userProfileLanguage);
      }
    }
  }

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      // Optimistic update
      setLanguageState(lang);

      // Cache immediately
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
          // Revert on error
          setLanguageState(userProfileLanguage);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(LANGUAGE_CACHE_KEY, userProfileLanguage);
          }
          return;
        }

        // Refresh user context to sync the change
        await refreshUser();
      } catch (err) {
        console.error("setLanguage error:", err);
        // Revert on error
        setLanguageState(userProfileLanguage);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(LANGUAGE_CACHE_KEY, userProfileLanguage);
        }
      }
    },
    [refreshUser, userProfileLanguage]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        loading: initializing && !user,
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
