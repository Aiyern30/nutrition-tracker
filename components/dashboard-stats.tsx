"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flame,
  Droplets,
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { DailyCheckIn } from "@/components/daily-check-in";
import { getStatusMessage } from "@/lib/utils/nutrition-colors";
import { calculateDietScore, getDietScoreColor } from "@/lib/utils/diet-score";

interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  weight: number;
  steps: number;
  sleep_hours: number;
  diet_quality_score: string;
}

interface Profile {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
  daily_water_goal: number;
  current_streak: number;
  weight: number;
  goal_type: string;
  target_weight: number | null;
}

export function DashboardStats() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weekSleepData, setWeekSleepData] = useState<number[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const startDate = format(subDays(new Date(), 6), "yyyy-MM-dd");

      const [summaryResult, weeklySleepResult, profileResult] =
        await Promise.all([
          supabase
            .from("daily_summaries")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", today)
            .single(),
          supabase
            .from("daily_summaries")
            .select("date, sleep_hours")
            .eq("user_id", user.id)
            .gte("date", startDate)
            .order("date", { ascending: true }),
          supabase
            .from("profiles")
            .select(
              "daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fats_goal, daily_water_goal, current_streak, weight, goal_type, target_weight"
            )
            .eq("id", user.id)
            .single(),
        ]);

      setDailySummary(summaryResult.data);

      // Process weekly sleep data
      const summaries = weeklySleepResult.data || [];
      const last7DaysSleep = Array.from({ length: 7 }, (_, i) => {
        const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        const dayData = summaries.find((s: any) => s.date === d);
        return Number(dayData?.sleep_hours || 0);
      });
      setWeekSleepData(last7DaysSleep);

      setProfile(profileResult.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback for sleep data on error
      setWeekSleepData(new Array(7).fill(0));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const todayDate = new Date();

  // Calculate percentages and values
  const weight = dailySummary?.weight || profile?.weight || 0;
  const weightGoal = profile?.target_weight || 70;

  const steps = dailySummary?.steps || 0;
  const stepsGoal = 10000;
  const stepsPercent = Math.min(100, Math.round((steps / stepsGoal) * 100));

  const sleepHours = dailySummary?.sleep_hours || 0;

  const waterIntake = dailySummary?.water_intake || 0;
  const waterGoal = profile?.daily_water_goal || 2; // Default 2L
  const waterRemaining = Math.max(0, waterGoal - waterIntake);
  const waterPercent = Math.min(100, (waterIntake / waterGoal) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Today's Overview
        </h2>
        <div className="z-20">
          <DailyCheckIn
            currentMetrics={{
              weight: weight || profile?.weight || undefined,
              steps,
              sleep_hours: sleepHours,
              water_intake: waterIntake,
            }}
            onUpdate={fetchData}
            selectedDate={todayDate}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Weight Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border/50 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <span className="text-base font-medium text-muted-foreground">
              {t.dashboard.stats.weight.title}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-foreground">
              {weight || "--"}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              kg
            </span>
          </div>

          {/* Ruler Visualization */}
          <div className="relative h-12 w-full mt-2">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full"></div>
            {/* Ruler Ticks */}
            <div className="flex justify-between px-2 text-[10px] text-muted-foreground font-medium mt-6">
              <span>{Math.max(0, Math.round(weight - 5))}</span>
              <span>{Math.round(weight)}</span>
              <span>{Math.round(weight + 5)}</span>
            </div>
            {/* Slider Thumb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+8px)] flex flex-col items-center">
              <div className="h-4 w-4 rounded-full bg-primary shadow-lg ring-4 ring-background"></div>
              <div className="h-4 w-0.5 bg-primary mt-1"></div>
            </div>
            {/* Decorative ticks background */}
            <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none opacity-20">
              {[...Array(21)].map((_, i) => (
                <div
                  key={i}
                  className={`w-px bg-foreground ${
                    i % 5 === 0 ? "h-4" : "h-2"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border/50 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <span className="text-base font-medium text-muted-foreground">
              {t.dashboard.stats.steps.title}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Flame className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-foreground">{steps}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {t.dashboard.stats.steps.subtitle}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${stepsPercent}%` }}
            />
            <div
              className="h-full flex-1 bg-primary/20"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, rgba(255,255,255,.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.3) 50%, rgba(255,255,255,.3) 75%, transparent 75%, transparent)",
                backgroundSize: "1rem 1rem",
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium">
            <span className="text-foreground">{stepsPercent}%</span>
            <span className="text-muted-foreground">
              {Math.max(0, stepsGoal - steps)} left
            </span>
          </div>
        </div>

        {/* Sleep Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border/50 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <span className="text-base font-medium text-muted-foreground">
              {t.dashboard.stats.sleep.title}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-foreground">
              {sleepHours}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {t.dashboard.stats.sleep.subtitle}
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-12 gap-1 mt-auto">
            {(weekSleepData.length > 0 ? weekSleepData : Array(7).fill(0)).map(
              (val, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      i === 6 ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                    style={{
                      height: `${Math.min(
                        100,
                        Math.max(10, (val / 8) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Water Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border/50 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <span className="text-base font-medium text-muted-foreground">
              {t.dashboard.stats.waterIntake.title}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Droplets className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-6 relative z-10">
            <span className="text-4xl font-bold text-foreground">
              {waterRemaining.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              litre left
            </span>
          </div>

          {/* Liquid Fill Visualization */}
          <div className="relative h-16 w-full rounded-xl bg-muted/30 overflow-hidden border border-border/50">
            <div
              className="absolute bottom-0 left-0 right-0 bg-yellow-400/80 dark:bg-yellow-500/80 transition-all duration-700 ease-in-out"
              style={{ height: `${waterPercent}%` }}
            >
              {/* Wave effect overlay could go here */}
              <div className="absolute top-0 w-full h-1 bg-white/30"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-end px-4 z-10">
              <span className="text-xs font-bold text-foreground/70 mix-blend-multiply dark:mix-blend-normal">
                {waterIntake}/{waterGoal} litre
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
