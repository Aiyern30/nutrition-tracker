"use client";

import { useLanguage } from "@/contexts/language-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ScanSearch,
  Utensils,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard-stats";
import { DailySummaryCard } from "@/components/daily-summary-card";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";
import { RecommendedMenu } from "@/components/recommended-menu";

export default function DashboardPage() {
  useLocalizedMetadata({ page: "dashboard" });

  const { t } = useLanguage();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold leading-tight tracking-tight">
                {t.dashboard.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Disclaimer Alert */}
          <Alert className="border-accent/50 bg-accent/5">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-foreground">
              {t.dashboard.disclaimer}
            </AlertDescription>
          </Alert>

          {/* Stats Grid */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Summary */}
            <DailySummaryCard />

            {/* Quick Actions */}
            <Card className="transition-all duration-300 shadow-sm border border-border/50 rounded-[2rem] bg-white dark:bg-card h-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  {t.dashboard.quickActions.title}
                </CardTitle>
                <CardDescription>
                  {t.dashboard.quickActions.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  asChild
                  className="w-full justify-start h-16 text-base font-medium transition-all hover:scale-[1.02] bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800 rounded-xl shadow-sm"
                  variant="ghost"
                >
                  <Link href="/chat">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-xl mr-3 border border-blue-200 dark:border-blue-700">
                      💬
                    </div>
                    {t.dashboard.quickActions.askAI}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start h-16 text-base font-medium transition-all hover:scale-[1.02] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 rounded-xl shadow-sm"
                  variant="ghost"
                >
                  <Link href="/tracker">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-xl mr-3 border border-emerald-200 dark:border-emerald-700">
                      📝
                    </div>
                    {t.dashboard.quickActions.logMeal}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start h-16 text-base font-medium transition-all hover:scale-[1.02] bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 dark:text-violet-300 border border-violet-100 dark:border-violet-800 rounded-xl shadow-sm"
                  variant="ghost"
                >
                  <Link href="/analyzer">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50 text-xl mr-3 border border-violet-200 dark:border-violet-700">
                      🔍
                    </div>
                    {t.dashboard.quickActions.analyzeFood}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start h-16 text-base font-medium transition-all hover:scale-[1.02] bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 border border-orange-100 dark:border-orange-800 rounded-xl shadow-sm"
                  variant="ghost"
                >
                  <Link href="/meal-planner">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50 text-xl mr-3 border border-orange-200 dark:border-orange-700">
                      📅
                    </div>
                    {t.dashboard.quickActions.getMealPlan}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Menu */}
          <RecommendedMenu />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
