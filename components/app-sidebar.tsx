/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const navItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    title: "AI Chat",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    title: "Meal Planner",
    icon: Utensils,
    href: "/meal-planner",
  },
  {
    title: "Food Analyzer",
    icon: ScanSearch,
    href: "/analyzer",
  },
  {
    title: "Diet Tracker",
    icon: TrendingUp,
    href: "/tracker",
  },
  {
    title: "Profile",
    icon: User,
    href: "/profile",
  },
];

interface UserProfile {
  email: string;
  name: string;
  avatar_url?: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  console.log("User in Sidebar:", user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        console.log("Supabase getUser:", authUser);

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
      (
        _event: any,
        session: {
          user: {
            email: string;
            user_metadata: { full_name: any; name: any; avatar_url: any };
          };
        }
      ) => {
        console.log("onAuthStateChange session:", session);
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
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]); // Remove supabase from dependency array

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
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
              NutriAI
            </span>
            <span className="text-xs text-muted-foreground">
              Nutrition Assistant
            </span>
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
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
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
                Sign In
              </span>
              <span className="text-xs text-muted-foreground">Get started</span>
            </div>
          </Link>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
