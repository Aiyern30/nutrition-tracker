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
  initializing: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const { setTheme } = useTheme();
  const supabase = createClient();

  const loadUserData = useCallback(
    async (authUser: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("theme, language")
        .eq("id", authUser.id)
        .single();

      setUser({
        email: authUser.email ?? "",
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "User",
        avatar_url: authUser.user_metadata?.avatar_url,
        created_at: authUser.created_at,
        profileSettings: profile ?? undefined,
      });

      if (profile?.theme) {
        setTheme(profile.theme);
      }
    },
    [supabase, setTheme]
  );

  // Initial load ONLY
  useEffect(() => {
    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        await loadUserData(authUser);
      }

      setInitializing(false);
    };

    init();
  }, [loadUserData, supabase]);

  // Auth changes (NO skeleton)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, supabase]);

  const refreshUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

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
