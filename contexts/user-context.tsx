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
  updateUserProfileSettings: (
    updates: Partial<UserProfile["profileSettings"]>
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
  // Load cached user once during initialization - use function initializer
  const [user, setUser] = useState<UserProfile | null>(() => loadCachedUser());
  const [initializing, setInitializing] = useState(() => {
    // If we have cached user, we're not initializing
    const cached = loadCachedUser();
    return cached === null;
  });

  const { setTheme } = useTheme();
  const supabase = useRef(createClient());
  const isInitialized = useRef(false);
  const isLoadingRef = useRef(false); // Prevent concurrent loads
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // If we have cached user, ensure initializing is false immediately
  useEffect(() => {
    const cached = loadCachedUser();
    if (cached) {
      setInitializing(false);
    }
  }, []); // Run only once on mount

  const loadUserData = useCallback(
    async (authUser: any, silent = false) => {
      // If already loading, wait for current load to complete
      if (isLoadingRef.current) {
        // Wait for current load (max 2 seconds)
        let waitCount = 0;
        while (isLoadingRef.current && waitCount < 40) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          waitCount++;
        }
        // If still loading after wait, skip this load to prevent deadlock
        // The current load will update the state anyway
        if (isLoadingRef.current) {
          console.warn("Skipping concurrent loadUserData call");
          return;
        }
      }

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

        // Ensure initializing is false once we have user data
        if (isInitialized.current) {
          setInitializing(false);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
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

  // Initial load ONLY - ensure it always completes
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) {
        // Already initialized, but ensure initializing is false
        setInitializing(false);
        return;
      }
      isInitialized.current = true;

      // Clear any existing timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      // Safety timeout: ensure initializing is set to false after max 3 seconds
      initTimeoutRef.current = setTimeout(() => {
        console.warn(
          "User initialization timeout - forcing initializing to false"
        );
        setInitializing(false);
      }, 3000);

      try {
        const {
          data: { user: authUser },
        } = await supabase.current.auth.getUser();

        if (authUser) {
          await loadUserData(authUser);
        } else {
          setUser(null);
          setInitializing(false);
        }
      } catch (error) {
        console.error("Error during user initialization:", error);
        // Even on error, ensure we're not stuck in initializing state
        setUser(null);
        setInitializing(false);
      } finally {
        // Always clear initializing state and timeout
        setInitializing(false);
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
      }
    };

    init();

    // Cleanup timeout on unmount
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [loadUserData]);

  // Auth changes - SILENT updates (no loading state)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.current.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Skip if this is just a token refresh or session restoration
        if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          // If we're past initial load and have a session, silently update user data
          if (isInitialized.current && session?.user) {
            await loadUserData(session.user, true);
          }
          return;
        }

        if (session?.user) {
          // Silent update - don't trigger loading states
          await loadUserData(session.user, true);
          // Ensure we're not stuck in initializing state
          if (isInitialized.current) {
            setInitializing(false);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(USER_CACHE_KEY);
          }
          // Ensure we're not stuck in initializing state
          setInitializing(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Handle window focus - ensure we're not stuck in initializing state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = async () => {
      // Only check if we're past initial load and stuck in initializing state
      if (!isInitialized.current) return;

      // Use a ref check to avoid dependency on initializing state
      // This prevents the effect from re-running when initializing changes
      const checkStuck = async () => {
        const {
          data: { user: authUser },
        } = await supabase.current.auth.getUser();

        // If we have a user but are still initializing, fix it
        if (authUser) {
          setInitializing(false);
          // Silently refresh user data
          await loadUserData(authUser, true);
        } else {
          // No user, ensure we're not initializing
          setInitializing(false);
        }
      };

      // Small delay to avoid race conditions with other auth events
      setTimeout(checkStuck, 100);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadUserData]); // Removed initializing from dependencies

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.current.auth.getUser();

    if (authUser) {
      await loadUserData(authUser, true); // Silent refresh
    }
  }, [loadUserData]);

  // Optimistically update user profile settings (for language/theme changes)
  const updateUserProfileSettings = useCallback(
    (updates: Partial<UserProfile["profileSettings"]>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          profileSettings: {
            ...prev.profileSettings,
            ...updates,
          } as UserProfile["profileSettings"],
        };
        // Update cache
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.error("Error updating cache:", error);
          }
        }
        return updated;
      });
    },
    []
  );

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
