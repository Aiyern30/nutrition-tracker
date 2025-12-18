/* eslint-disable react/no-unescaped-entities */
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
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Good morning! Here's your nutrition overview
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Disclaimer Alert */}
          <Alert className="border-accent/50 bg-accent/5">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-foreground">
              This app provides nutritional information for educational purposes
              only and is not a substitute for professional medical advice.
            </AlertDescription>
          </Alert>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Daily Calories"
              value="1,458"
              subtitle="542 remaining"
              icon={Flame}
              trend={{ value: 5, isPositive: false }}
            />
            <StatCard
              title="Water Intake"
              value="6 / 8"
              subtitle="glasses today"
              icon={Droplets}
            />
            <StatCard
              title="Diet Score"
              value="B+"
              subtitle="Good balance"
              icon={TrendingUp}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="Streak"
              value="7 days"
              subtitle="Keep it up!"
              icon={TrendingUp}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>
                  Track your nutrition progress throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
                  <CalorieRing consumed={1458} goal={2000} />
                  <div className="w-full max-w-md space-y-4">
                    <MacroBar
                      label="Protein"
                      current={65}
                      goal={150}
                      color="primary"
                    />
                    <MacroBar
                      label="Carbs"
                      current={180}
                      goal={250}
                      color="accent"
                    />
                    <MacroBar
                      label="Fats"
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
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>What would you like to do?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/chat">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ask AI a Question
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/tracker">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Log a Meal
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/analyzer">
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Analyze Food
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                >
                  <Link href="/meal-planner">
                    <Utensils className="mr-2 h-4 w-4" />
                    Get Meal Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest nutrition interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    time: "2 hours ago",
                    action: "Logged lunch",
                    details: "Grilled chicken salad - 450 cal",
                  },
                  {
                    time: "5 hours ago",
                    action: "Analyzed food",
                    details: "Greek yogurt with berries",
                  },
                  {
                    time: "Yesterday",
                    action: "Generated meal plan",
                    details: "7-day balanced diet",
                  },
                  {
                    time: "Yesterday",
                    action: "Asked AI",
                    details: "Best protein sources for vegans",
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
