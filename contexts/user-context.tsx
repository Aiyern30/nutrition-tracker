/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  const supabase = createClient();

  const loadUserData = useCallback(
    async (authUser: any) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("theme, language")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
      }

      const userData: UserProfile = {
        email: authUser.email ?? "",
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "User",
        avatar_url: authUser.user_metadata?.avatar_url,
        created_at: authUser.created_at,
        profileSettings: profile
          ? {
              theme: profile.theme ?? "system",
              language: profile.language ?? "en",
            }
          : undefined,
      };

      setUser(userData);

      if (profile?.theme) {
        setTheme(profile.theme);
      }
    },
    [supabase, setTheme]
  );

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        await loadUserData(authUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("refreshUser error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadUserData, supabase]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          await loadUserData(authUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("init auth error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        try {
          setLoading(true);

          if (session?.user) {
            await loadUserData(session.user);
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData, supabase]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
