"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/user-context";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { user, updateUserProfileSettings } = useUser();
  const [mounted, setMounted] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const toggleTheme = async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    
    // Optimistically update theme in UI and user context
    setTheme(newTheme);
    if (user) {
      updateUserProfileSettings({ theme: newTheme });
    }

    // Save theme to profile (don't wait for it)
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      await supabase
        .from("profiles")
        .update({
          theme: newTheme,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);
    } catch (error) {
      console.error("Error saving theme to profile:", error);
      // On error, revert by refreshing user context
      // But don't revert the theme immediately to avoid flicker
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
