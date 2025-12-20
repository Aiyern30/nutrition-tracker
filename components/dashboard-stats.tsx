"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flame,
  Droplets,
  TrendingUp,
  Award,
  AlertTriangle,
} from "lucide-react";
import { getStatusMessage } from "@/lib/utils/nutrition-colors";
import { calculateDietScore, getDietScoreColor } from "@/lib/utils/diet-score";

interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  diet_quality_score: string;
}

interface Profile {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
  daily_water_goal: number;
  current_streak: number;
}

export function DashboardStats() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
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
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single(),
        supabase
          .from("profiles")
          .select(
            "daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fats_goal, daily_water_goal, current_streak"
          )
          .eq("id", user.id)
          .single(),
      ]);

      setDailySummary(summaryResult.data);
      setProfile(profileResult.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  const consumedCalories = dailySummary?.total_calories || 0;
  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const caloriesExceeded = consumedCalories > calorieGoal;

  const consumedProtein = dailySummary?.total_protein || 0;
  const proteinGoal = profile?.daily_protein_goal || 150;

  const consumedCarbs = dailySummary?.total_carbs || 0;
  const carbsGoal = profile?.daily_carbs_goal || 200;

  const consumedFats = dailySummary?.total_fats || 0;
  const fatsGoal = profile?.daily_fats_goal || 65;

  const waterIntake = dailySummary?.water_intake || 0;
  const waterGoal = profile?.daily_water_goal || 8;
  const waterComplete = waterIntake >= waterGoal;

  // Calculate diet score dynamically
  const dietScore = calculateDietScore(
    consumedCalories,
    consumedProtein,
    consumedCarbs,
    consumedFats,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatsGoal
  );

  const streak = profile?.current_streak || 0;

  const calorieTrend =
    calorieGoal > 0
      ? Math.round((consumedCalories / calorieGoal) * 100) - 100
      : 0;

  // Translation object for status messages
  const statusTranslations = {
    overGoal: t.dashboard.todaysSummary.overGoal,
    remaining: t.dashboard.todaysSummary.remaining,
    optimal: t.dashboard.todaysSummary.almostThere,
    aboveRecommended: t.dashboard.todaysSummary.overGoal,
    belowTarget: t.dashboard.todaysSummary.remaining,
    toGo: t.dashboard.todaysSummary.remaining,
    goalReached: t.dashboard.stats.dietScore.subtitle,
    goalAchieved: t.dashboard.stats.dietScore.subtitle,
    noGoalSet: "",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t.dashboard.stats.dailyCalories.title}
        value={consumedCalories.toLocaleString()}
        subtitle={getStatusMessage(
          consumedCalories,
          calorieGoal,
          "calories",
          statusTranslations
        )}
        icon={caloriesExceeded ? AlertTriangle : Flame}
        trend={
          calorieTrend !== 0
            ? {
                value: Math.abs(calorieTrend),
                isPositive: calorieTrend < 0,
              }
            : undefined
        }
        variant={caloriesExceeded ? "destructive" : "default"}
      />
      <StatCard
        title={t.dashboard.stats.waterIntake.title}
        value={`${waterIntake} / ${waterGoal}`}
        subtitle={getStatusMessage(
          waterIntake,
          waterGoal,
          "water",
          statusTranslations
        )}
        icon={Droplets}
        variant={waterComplete ? "success" : "default"}
      />
      <StatCard
        title={t.dashboard.stats.dietScore.title}
        value={dietScore}
        subtitle={t.dashboard.stats.dietScore.subtitle}
        icon={Award}
        variant={
          getDietScoreColor(dietScore) as
            | "success"
            | "destructive"
            | "warning"
            | "default"
        }
      />
      <StatCard
        title={t.dashboard.stats.streak.title}
        value={`${streak} ${t.dashboard.stats.streak.days}`}
        subtitle={t.dashboard.stats.streak.subtitle}
        icon={TrendingUp}
        variant={streak > 0 ? "success" : "default"}
      />
    </div>
  );
}
