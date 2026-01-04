"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import {
  getProgressColor,
  getStatusMessage,
} from "@/lib/utils/nutrition-colors";

interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
}

interface Profile {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
}

import { Zap, Utensils, Flame } from "lucide-react";

export function DailySummaryCard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<
    (DailySummary & { steps: number }) | null
  >(null);
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

      const [summaryResult, profileResult] = await Promise.all([
        supabase
          .from("daily_summaries")
          .select(
            "total_calories, total_protein, total_carbs, total_fats, steps"
          )
          .eq("user_id", user.id)
          .eq("date", today)
          .single(),
        supabase
          .from("profiles")
          .select(
            "daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fats_goal"
          )
          .eq("id", user.id)
          .single(),
      ]);

      setDailySummary(summaryResult.data);
      setProfile(profileResult.data);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const consumedCalories = dailySummary?.total_calories || 0;
  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const caloriesLeft = Math.max(0, calorieGoal - consumedCalories);
  const percentCalories = Math.min(100, (consumedCalories / calorieGoal) * 100);

  // Estimate burned calories from steps (approx 0.04 kcal per step)
  const burnedCalories = Math.round((dailySummary?.steps || 0) * 0.04);

  const macros = [
    {
      label: t.dashboard.todaysSummary.carbs,
      current: dailySummary?.total_carbs || 0,
      target: profile?.daily_carbs_goal || 300,
      color: "bg-[#a3e635]", // Lime
      percent: Math.round(
        ((dailySummary?.total_carbs || 0) /
          (profile?.daily_carbs_goal || 300)) *
          100
      ),
    },
    {
      label: t.dashboard.todaysSummary.protein,
      current: dailySummary?.total_protein || 0,
      target: profile?.daily_protein_goal || 75,
      color: "bg-[#84cc16]", // Green
      percent: Math.round(
        ((dailySummary?.total_protein || 0) /
          (profile?.daily_protein_goal || 75)) *
          100
      ),
    },
    {
      label: t.dashboard.todaysSummary.fats,
      current: dailySummary?.total_fats || 0,
      target: profile?.daily_fats_goal || 60,
      color: "bg-[#bef264]", // Light Lime
      percent: Math.round(
        ((dailySummary?.total_fats || 0) / (profile?.daily_fats_goal || 60)) *
          100
      ),
    },
  ];

  return (
    <Card className="lg:col-span-2 shadow-sm border border-border/50 rounded-[2rem] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            {t.dashboard.todaysSummary.title}
          </CardTitle>
          <div className="flex bg-muted/50 rounded-full px-2 py-0.5">
            <span className="text-xs text-muted-foreground font-medium">
              {t.dashboard.todaysSummary.today}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {loading ? (
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-8">
            <Skeleton className="h-48 w-48 rounded-full" />
            <div className="space-y-4 w-full max-w-sm">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Left: Calorie Ring */}
            <div className="relative shrink-0">
              <div className="relative h-48 w-48">
                {/* Background Circle */}
                <svg
                  className="h-full w-full -rotate-90 transform"
                  viewBox="0 0 100 100"
                >
                  <circle
                    className="text-muted/30"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  {/* Progress Circle */}
                  <circle
                    className="transition-all duration-1000 ease-out text-orange-400"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    strokeDasharray={263.89} // 2 * pi * 42
                    strokeDashoffset={263.89 - (percentCalories / 100) * 263.89}
                    r="42"
                    cx="50"
                    cy="50"
                    style={{
                      filter: "drop-shadow(0 0 2px rgba(251, 146, 60, 0.5))",
                    }}
                  />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <Zap className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-3xl font-extrabold tracking-tighter text-foreground">
                    {caloriesLeft}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.dashboard.todaysSummary.kcalLeft}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Macros */}
            <div className="flex-1 w-full space-y-8">
              {/* Top Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#d9f99d] flex items-center justify-center text-[#4d7c0f]">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold leading-none">
                      {consumedCalories}{" "}
                      <span className="text-xs font-medium text-muted-foreground">
                        {t.dashboard.units.kcal}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {t.dashboard.todaysSummary.eatenCalories}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#fef08a] flex items-center justify-center text-[#a16207]">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold leading-none">
                      {burnedCalories}{" "}
                      <span className="text-xs font-medium text-muted-foreground">
                        {t.dashboard.units.kcal}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {t.dashboard.todaysSummary.burnedCalories}
                    </span>
                  </div>
                </div>
              </div>

              {/* Macros List */}
              <div className="space-y-5">
                {macros.map((macro, i) => (
                  <div key={i} className="bg-muted/30 rounded-xl p-3 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-foreground">
                          {macro.current}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {macro.target}
                          {t.dashboard.units.g}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {macro.label}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {macro.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${macro.color} transition-all duration-500`}
                        style={{ width: `${Math.min(100, macro.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
