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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();
  const mountedRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  const loadUserData = useCallback(
    async (authUser: any) => {
      try {
        const supabase = createClient();
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

        setUser(userData);

        if (profile?.theme) {
          setTheme(profile.theme);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUser(null);
      }
    },
    [setTheme]
  );

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        await loadUserData(authUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    // Prevent double mounting in strict mode
    if (mountedRef.current) return;
    mountedRef.current = true;

    const supabase = createClient();

    const initialize = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          await loadUserData(authUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
      mountedRef.current = false;
    };
  }, [loadUserData]);

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
