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
            <Card className="transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-primary/20 h-full">
              <CardHeader>
                <CardTitle>{t.dashboard.quickActions.title}</CardTitle>
                <CardDescription>
                  {t.dashboard.quickActions.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  asChild
                  className="w-full justify-start h-14 text-base font-medium transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                  variant="outline"
                >
                  <Link href="/chat">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100/50 text-blue-600 mr-3">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    {t.dashboard.quickActions.askAI}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start h-14 text-base font-medium transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                  variant="outline"
                >
                  <Link href="/tracker">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100/50 text-green-600 mr-3">
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    {t.dashboard.quickActions.logMeal}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start h-14 text-base font-medium transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                  variant="outline"
                >
                  <Link href="/analyzer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100/50 text-purple-600 mr-3">
                      <ScanSearch className="h-4 w-4" />
                    </div>
                    {t.dashboard.quickActions.analyzeFood}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start h-14 text-base font-medium transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                  variant="outline"
                >
                  <Link href="/meal-planner">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100/50 text-orange-600 mr-3">
                      <Utensils className="h-4 w-4" />
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
