/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

interface UserProfile {
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
  profileSettings?: {
    theme: string;
    language: string;
  };
}

interface UserContextType {
  user: UserProfile | null;
  initializing: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_CACHE_KEY = "user_cache";

// Helper function to load cached user
const loadCachedUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error("Error loading user cache:", error);
  }
  return null;
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Load cached user once during initialization
  const [user, setUser] = useState<UserProfile | null>(() => loadCachedUser());
  const [initializing, setInitializing] = useState(() => !loadCachedUser());
  const { setTheme } = useTheme();
  const supabase = useRef(createClient());
  const isInitialized = useRef(false);

  const loadUserData = useCallback(
    async (authUser: any) => {
      const { data: profile } = await supabase.current
        .from("profiles")
        .select("theme, language")
        .eq("id", authUser.id)
        .single();

      const userData = {
        email: authUser.email ?? "",
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "User",
        avatar_url: authUser.user_metadata?.avatar_url,
        created_at: authUser.created_at,
        profileSettings: profile ?? undefined,
      };

      setUser(userData);

      // Cache user data
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        } catch (error) {
          console.error("Error caching user data:", error);
        }
      }

      if (profile?.theme) {
        setTheme(profile.theme);
      }
    },
    [setTheme]
  );

  // Apply cached theme on mount (only once)
  useEffect(() => {
    const cached = loadCachedUser();
    if (cached?.profileSettings?.theme) {
      setTheme(cached.profileSettings.theme);
    }
  }, [setTheme]);

  // Initial load ONLY
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      const {
        data: { user: authUser },
      } = await supabase.current.auth.getUser();

      if (authUser) {
        await loadUserData(authUser);
      } else {
        setUser(null);
      }

      setInitializing(false);
    };

    init();
  }, [loadUserData]);

  // Auth changes (NO skeleton)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.current.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(USER_CACHE_KEY);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const refreshUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.current.auth.getUser();

    if (authUser) {
      await loadUserData(authUser);
    }
  };

  return (
    <UserContext.Provider value={{ user, initializing, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
