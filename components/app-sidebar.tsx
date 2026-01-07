"use client";
import Image from "next/image";
import { User, LogOut, ChevronDown, Globe, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/contexts/language-context";
import { useUser } from "@/contexts/user-context";

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

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { user, initializing: userInitializing } = useUser();

  // Only show loading on INITIAL load when there's no user data at all
  // Don't show loading if we have cached user or if we're just refreshing
  const showLoading = userInitializing && user === null;

  const navItems = [
    {
      title: t.sidebar.dashboard,
      icon: "📊",
      href: "/",
    },
    {
      title: t.sidebar.aiChat,
      icon: "💬",
      href: "/chat",
    },
    {
      title: t.sidebar.mealPlanner,
      icon: "📅",
      href: "/meal-planner",
    },
    {
      title: t.sidebar.foodAnalyzer,
      icon: "🔍",
      href: "/analyzer",
    },
    {
      title: t.sidebar.dietTracker,
      icon: "📝",
      href: "/tracker",
    },
    {
      title: t.sidebar.dailySummaries,
      icon: "📈",
      href: "/daily-summaries",
    },
    {
      title: t.sidebar.profile,
      icon: "👤",
      href: "/profile",
    },
  ];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleLanguageToggle = async () => {
    try {
      const newLanguage = language === "en" ? "zh" : "en";
      await setLanguage(newLanguage);
    } catch (error) {
      console.error("Error toggling language:", error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/50 pb-4">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 overflow-hidden">
            <Image
              src="/Logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-sidebar-foreground tracking-tight">
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
                  "w-full px-4 py-6 h-12 transition-all duration-200 ease-in-out font-medium",
                  pathname === item.href
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 shadow-sm border border-emerald-200 dark:border-emerald-800"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                )}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <span className="text-xl leading-none flex items-center justify-center w-6 h-6">
                    {item.icon}
                  </span>
                  <span className="text-base font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {showLoading ? (
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
