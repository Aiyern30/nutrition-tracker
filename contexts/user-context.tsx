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
  // Load cached user once during initialization - use function initializer
  const [user, setUser] = useState<UserProfile | null>(() => loadCachedUser());
  const [initializing, setInitializing] = useState(() => {
    // If we have cached user, we're not initializing
    return loadCachedUser() === null;
  });

  const { setTheme } = useTheme();
  const supabase = useRef(createClient());
  const isInitialized = useRef(false);
  const isLoadingRef = useRef(false); // Prevent concurrent loads

  const loadUserData = useCallback(
    async (authUser: any, silent = false) => {
      // Prevent concurrent loads
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
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

        if (profile?.theme && !silent) {
          setTheme(profile.theme);
        }
      } finally {
        isLoadingRef.current = false;
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

  // Auth changes - SILENT updates (no loading state)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.current.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Skip if this is just a token refresh or session restoration
        if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          return;
        }

        if (session?.user) {
          // Silent update - don't trigger loading states
          await loadUserData(session.user, true);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(USER_CACHE_KEY);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.current.auth.getUser();

    if (authUser) {
      await loadUserData(authUser, true); // Silent refresh
    }
  }, [loadUserData]);

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
