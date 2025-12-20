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
import { StatCard } from "@/components/stat-card";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import {
  Flame,
  Droplets,
  TrendingUp,
  MessageSquare,
  ScanSearch,
  Utensils,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function DashboardPage() {
  const { t } = useLanguage();

  // Add safety check
  if (!t || !t.dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t.dashboard.stats.dailyCalories.title}
              value="1,458"
              subtitle={`542 ${t.dashboard.stats.dailyCalories.remaining}`}
              icon={Flame}
              trend={{ value: 5, isPositive: false }}
            />
            <StatCard
              title={t.dashboard.stats.waterIntake.title}
              value="6 / 8"
              subtitle={t.dashboard.stats.waterIntake.subtitle}
              icon={Droplets}
            />
            <StatCard
              title={t.dashboard.stats.dietScore.title}
              value="B+"
              subtitle={t.dashboard.stats.dietScore.subtitle}
              icon={TrendingUp}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title={t.dashboard.stats.streak.title}
              value={`7 ${t.dashboard.stats.streak.days}`}
              subtitle={t.dashboard.stats.streak.subtitle}
              icon={TrendingUp}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t.dashboard.todaysSummary.title}</CardTitle>
                <CardDescription>
                  {t.dashboard.todaysSummary.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
                  <CalorieRing consumed={1458} goal={2000} />
                  <div className="w-full max-w-md space-y-4">
                    <MacroBar
                      label={t.dashboard.todaysSummary.protein}
                      current={65}
                      goal={150}
                      color="primary"
                    />
                    <MacroBar
                      label={t.dashboard.todaysSummary.carbs}
                      current={180}
                      goal={250}
                      color="accent"
                    />
                    <MacroBar
                      label={t.dashboard.todaysSummary.fats}
                      current={42}
                      goal={65}
                      color="chart-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.recentActivity.title}</CardTitle>
              <CardDescription>
                {t.dashboard.recentActivity.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    time: `2 ${t.dashboard.recentActivity.time.hoursAgo}`,
                    action: t.dashboard.recentActivity.activities.loggedLunch,
                    details: t.dashboard.recentActivity.details.grilledChicken,
                  },
                  {
                    time: `5 ${t.dashboard.recentActivity.time.hoursAgo}`,
                    action: t.dashboard.recentActivity.activities.analyzedFood,
                    details: t.dashboard.recentActivity.details.greekYogurt,
                  },
                  {
                    time: t.dashboard.recentActivity.time.yesterday,
                    action:
                      t.dashboard.recentActivity.activities.generatedMealPlan,
                    details: t.dashboard.recentActivity.details.balancedDiet,
                  },
                  {
                    time: t.dashboard.recentActivity.time.yesterday,
                    action: t.dashboard.recentActivity.activities.askedAI,
                    details: t.dashboard.recentActivity.details.proteinSources,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.details}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
