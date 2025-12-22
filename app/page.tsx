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

export default function DashboardPage() {
  useLocalizedMetadata({ page: "dashboard" });

  const { t } = useLanguage();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{t.dashboard.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t.dashboard.greeting}
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
            <Card>
              <CardHeader>
                <CardTitle>{t.dashboard.quickActions.title}</CardTitle>
                <CardDescription>
                  {t.dashboard.quickActions.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/chat">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t.dashboard.quickActions.askAI}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/tracker">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t.dashboard.quickActions.logMeal}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/analyzer">
                    <ScanSearch className="mr-2 h-4 w-4" />
                    {t.dashboard.quickActions.analyzeFood}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/meal-planner">
                    <Utensils className="mr-2 h-4 w-4" />
                    {t.dashboard.quickActions.getMealPlan}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
