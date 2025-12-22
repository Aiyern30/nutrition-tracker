/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
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
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a singleton to store user data across component remounts
let cachedUser: UserProfile | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const { setTheme } = useTheme();
  const initialLoadDone = useRef(!!cachedUser);
  const isFetching = useRef(false);

  const updateUserCache = useCallback((userData: UserProfile | null) => {
    cachedUser = userData;
    cacheTimestamp = Date.now();
    setUser(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    try {
      setLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme, language")
          .eq("id", authUser.id)
          .single();

        const userData = {
          email: authUser.email || "",
          name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "User",
          avatar_url: authUser.user_metadata?.avatar_url,
          created_at: authUser.created_at,
          profileSettings: profile
            ? {
                theme: profile.theme || "system",
                language: profile.language || "en",
              }
            : undefined,
        };

        updateUserCache(userData);

        if (profile?.theme) {
          setTheme(profile.theme);
        }
      } else {
        updateUserCache(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      updateUserCache(null);
    } finally {
      setLoading(false);
    }
  }, [setTheme, updateUserCache]);

  useEffect(() => {
    // If we have recent cached data, use it
    const now = Date.now();
    if (cachedUser && now - cacheTimestamp < CACHE_DURATION) {
      setUser(cachedUser);
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }

    // Skip if already fetching
    if (isFetching.current) return;

    // Skip if already loaded recently
    if (initialLoadDone.current) {
      setLoading(false);
      return;
    }

    isFetching.current = true;
    let mounted = true;
    const supabase = createClient();

    const loadUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("theme, language")
            .eq("id", authUser.id)
            .single();

          if (mounted) {
            const userData = {
              email: authUser.email || "",
              name:
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                authUser.email?.split("@")[0] ||
                "User",
              avatar_url: authUser.user_metadata?.avatar_url,
              created_at: authUser.created_at,
              profileSettings: profile
                ? {
                    theme: profile.theme || "system",
                    language: profile.language || "en",
                  }
                : undefined,
            };

            updateUserCache(userData);

            if (profile?.theme) {
              setTheme(profile.theme);
            }
          }
        } else {
          updateUserCache(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        if (mounted) {
          updateUserCache(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          initialLoadDone.current = true;
          isFetching.current = false;
        }
      }
    };

    loadUser();

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!mounted) return;

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("theme, language")
            .eq("id", session.user.id)
            .single();

          if (mounted) {
            const userData = {
              email: session.user.email || "",
              name:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0] ||
                "User",
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              profileSettings: profile
                ? {
                    theme: profile.theme || "system",
                    language: profile.language || "en",
                  }
                : undefined,
            };

            updateUserCache(userData);

            if (profile?.theme) {
              setTheme(profile.theme);
            }
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      } else if (mounted) {
        updateUserCache(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setTheme, updateUserCache]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
