/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
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
  created_at?: string; // Add auth user created_at
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

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Only fetch theme and language from profile, not the entire profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme, language")
          .eq("id", authUser.id)
          .single();

        setUser({
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
        });

        if (profile?.theme) {
          setTheme(profile.theme);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    refreshUser();

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
            setUser({
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
            });

            if (profile?.theme) {
              setTheme(profile.theme);
            }
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setTheme, refreshUser]);

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
