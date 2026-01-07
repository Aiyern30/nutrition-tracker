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
          {t.dashboard.todayOverview}
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
        <div className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium mb-1">
                {t.dashboard.stats.weight.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                  {weight || "--"}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {t.dashboard.units.kg}
                </span>
              </div>
            </div>
            <div className="bg-indigo-500 rounded-xl p-3 shadow-lg shadow-indigo-500/20 text-white">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>

          {/* Ruler Visualization */}
          <div className="relative h-12 w-full mt-2 opacity-80">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-200 dark:bg-indigo-800 rounded-full"></div>
            {/* Ruler Ticks */}
            <div className="flex justify-between px-2 text-[10px] text-indigo-600 dark:text-indigo-300 font-medium mt-6">
              <span>{Math.max(0, Math.round(weight - 5))}</span>
              <span>{Math.round(weight)}</span>
              <span>{Math.round(weight + 5)}</span>
            </div>
            {/* Slider Thumb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+8px)] flex flex-col items-center">
              <div className="h-4 w-4 rounded-full bg-indigo-600 shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-900/50"></div>
              <div className="h-4 w-0.5 bg-indigo-600 mt-1"></div>
            </div>
          </div>
        </div>

        {/* Steps Card */}
        <div className="bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-1">
                {t.dashboard.stats.steps.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {steps}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {t.dashboard.stats.steps.subtitle}
                </span>
              </div>
            </div>
            <div className="bg-emerald-500 rounded-xl p-3 shadow-lg shadow-emerald-500/20 text-white">
              <span className="text-2xl">👟</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-800/50">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out relative"
                style={{ width: `${stepsPercent}%` }}
              >
                <div
                  className="absolute inset-0 bg-white/20"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, rgba(255,255,255,.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.3) 50%, rgba(255,255,255,.3) 75%, transparent 75%, transparent)",
                    backgroundSize: "1rem 1rem",
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <span>{stepsPercent}%</span>
              <span>
                {Math.max(0, stepsGoal - steps)} {t.dashboard.units.stepsLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-linear-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-800 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-violet-700 dark:text-violet-300 font-medium mb-1">
                {t.dashboard.stats.sleep.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-violet-900 dark:text-violet-100">
                  {sleepHours}
                </span>
                <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                  {t.dashboard.stats.sleep.subtitle}
                </span>
              </div>
            </div>
            <div className="bg-violet-500 rounded-xl p-3 shadow-lg shadow-violet-500/20 text-white">
              <span className="text-2xl">😴</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-10 gap-1 mt-6">
            {(weekSleepData.length > 0 ? weekSleepData : Array(7).fill(0)).map(
              (val, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      i === 6
                        ? "bg-violet-600"
                        : "bg-violet-300 dark:bg-violet-700"
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
        <div className="bg-linear-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-2xl p-6 border border-cyan-200 dark:border-cyan-800 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium mb-1">
                {t.dashboard.stats.waterIntake.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">
                  {waterRemaining.toFixed(1)}
                </span>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                  {t.dashboard.units.litreLeft}
                </span>
              </div>
            </div>
            <div className="bg-cyan-500 rounded-xl p-3 shadow-lg shadow-cyan-500/20 text-white">
              <span className="text-2xl">💧</span>
            </div>
          </div>

          {/* Liquid Fill Visualization */}
          <div className="relative h-12 w-full rounded-xl bg-white/50 dark:bg-black/10 overflow-hidden border border-cyan-200 dark:border-cyan-700 mt-2">
            <div
              className="absolute bottom-0 left-0 right-0 bg-cyan-400/80 transition-all duration-700 ease-in-out"
              style={{ height: `${waterPercent}%` }}
            >
              <div className="absolute top-0 w-full h-1 bg-white/30"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-xs font-bold text-cyan-900 dark:text-cyan-100">
                {waterIntake}/{waterGoal} {t.dashboard.units.litre}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
