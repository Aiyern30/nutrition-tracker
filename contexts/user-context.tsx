/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import type { AuthChangeEvent } from "@supabase/supabase-js";

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
  updateUserProfileSettings: (
    settings: Partial<{ theme: string; language: string }>
  ) => void;
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
  const [user, setUser] = useState<UserProfile | null>(() => loadCachedUser());
  const [initializing, setInitializing] = useState(
    () => loadCachedUser() === null
  );

  const { setTheme } = useTheme();
  const supabase = useRef(createClient());
  const isInitialized = useRef(false);
  const isLoadingRef = useRef(false);
  const hasSetInitialTheme = useRef(false);
  const authListenerActive = useRef(false); // Track if auth listener should process events

  const loadUserData = useCallback(
    async (authUser: any, silent = false) => {
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

        setUser((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(userData)) {
            return prev;
          }
          return userData;
        });

        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
          } catch (error) {
            console.error("Error caching user data:", error);
          }
        }

        if (profile?.theme && !silent && !hasSetInitialTheme.current) {
          setTheme(profile.theme);
          hasSetInitialTheme.current = true;
        }
      } finally {
        isLoadingRef.current = false;
      }
    },
    [setTheme]
  );

  const updateUserProfileSettings = useCallback(
    (settings: Partial<{ theme: string; language: string }>) => {
      setUser((prev) => {
        if (!prev) return prev;

        const updatedUser = {
          ...prev,
          profileSettings: {
            theme: prev.profileSettings?.theme ?? "system",
            language: prev.profileSettings?.language ?? "en",
            ...settings,
          },
        };

        if (
          JSON.stringify(prev.profileSettings) ===
          JSON.stringify(updatedUser.profileSettings)
        ) {
          return prev;
        }

        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
          } catch (error) {
            console.error("Error updating user cache:", error);
          }
        }

        return updatedUser;
      });
    },
    []
  );

  // Apply cached theme on mount (only once)
  useEffect(() => {
    if (hasSetInitialTheme.current) return;

    const cached = loadCachedUser();
    if (cached?.profileSettings?.theme) {
      setTheme(cached.profileSettings.theme);
      hasSetInitialTheme.current = true;
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

      // Enable auth listener ONLY after initial load is complete
      authListenerActive.current = true;
    };

    init();
  }, [loadUserData]);

  // Auth changes - COMPLETELY DISABLED until initial load completes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.current.auth.onAuthStateChange(
      async (event: AuthChangeEvent) => {
        // CRITICAL: Don't process ANY events until auth listener is explicitly enabled
        if (!authListenerActive.current) {
          return;
        }

        // Only process explicit sign out events
        if (event === "SIGNED_OUT") {
          setUser(null);
          hasSetInitialTheme.current = false;
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(USER_CACHE_KEY);
          }
          return;
        }

        // Ignore ALL other events (TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED, etc.)
        // This prevents unnecessary reloads when switching tabs
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Prevent visibility change from triggering auth updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When tab becomes visible again, do nothing
      // The cached data is sufficient
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (isLoadingRef.current) return;

    const {
      data: { user: authUser },
    } = await supabase.current.auth.getUser();

    if (authUser) {
      await loadUserData(authUser, true);
    }
  }, [loadUserData]);

  return (
    <UserContext.Provider
      value={{ user, initializing, refreshUser, updateUserProfileSettings }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
