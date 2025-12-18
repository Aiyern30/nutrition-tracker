/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Home,
  MessageSquare,
  Utensils,
  ScanSearch,
  TrendingUp,
  User,
  Apple,
  LogOut,
  ChevronDown,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/contexts/language-context";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserProfile {
  email: string;
  name: string;
  avatar_url?: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Update navItems to use translations
  const navItems = [
    {
      title: t.sidebar.dashboard,
      icon: Home,
      href: "/",
    },
    {
      title: t.sidebar.aiChat,
      icon: MessageSquare,
      href: "/chat",
    },
    {
      title: t.sidebar.mealPlanner,
      icon: Utensils,
      href: "/meal-planner",
    },
    {
      title: t.sidebar.foodAnalyzer,
      icon: ScanSearch,
      href: "/analyzer",
    },
    {
      title: t.sidebar.dietTracker,
      icon: TrendingUp,
      href: "/tracker",
    },
    {
      title: t.sidebar.profile,
      icon: User,
      href: "/profile",
    },
  ];

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({
            email: authUser.email || "",
            name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              "User",
            avatar_url: authUser.user_metadata?.avatar_url,
          });

          // Load theme from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("theme")
            .eq("id", authUser.id)
            .single();

          if (profile?.theme) {
            setTheme(profile.theme);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (
        _event: any,
        session: {
          user: {
            id: string;
            email: string;
            user_metadata: { full_name: any; name: any; avatar_url: any };
          };
        }
      ) => {
        if (session?.user) {
          setUser({
            email: session.user.email || "",
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "User",
            avatar_url: session.user.user_metadata?.avatar_url,
          });

          // Load theme from profile
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("theme")
              .eq("id", session.user.id)
              .single();

            if (profile?.theme) {
              setTheme(profile.theme);
            }
          } catch (error) {
            console.error("Error loading theme:", error);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setTheme]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleLanguageToggle = async () => {
    try {
      const newLanguage = language === "en" ? "zh" : "en";
      
      // Just call setLanguage from context - it handles database update
      await setLanguage(newLanguage);
    } catch (error) {
      console.error("Error toggling language:", error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Apple className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-sidebar-foreground">
              {t.sidebar.appName}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.sidebar.appSubtitle}
            </span>
          </div>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className={cn(
                  "w-full px-4",
                  pathname === item.href &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-1 flex-col items-start">
                  <span className="text-sm font-medium text-sidebar-foreground truncate max-w-35">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-35">
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t.sidebar.profileSettings}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLanguageToggle}
                className="cursor-pointer"
              >
                <Globe className="mr-2 h-4 w-4" />
                <span className="flex items-center justify-between w-full">
                  <span>Language</span>
                  <span className="text-xs text-muted-foreground">
                    {language === "en" ? "EN" : "中文"}
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.sidebar.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {t.sidebar.signIn}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.sidebar.getStarted}
              </span>
            </div>
          </Link>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
