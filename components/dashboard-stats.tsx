"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { StatCard } from "@/components/stat-card";
import { Flame, Droplets, TrendingUp } from "lucide-react";

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
          <div
            key={i}
            className="h-32 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  const consumedCalories = dailySummary?.total_calories || 0;
  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const remainingCalories = Math.max(0, calorieGoal - consumedCalories);

  const waterIntake = dailySummary?.water_intake || 0;
  const waterGoal = profile?.daily_water_goal || 8;

  const dietScore = dailySummary?.diet_quality_score || "B+";
  const streak = profile?.current_streak || 0;

  const calorieTrend =
    calorieGoal > 0
      ? Math.round((consumedCalories / calorieGoal) * 100) - 100
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t.dashboard.stats.dailyCalories.title}
        value={consumedCalories.toLocaleString()}
        subtitle={`${remainingCalories.toLocaleString()} ${
          t.dashboard.stats.dailyCalories.remaining
        }`}
        icon={Flame}
        trend={
          calorieTrend !== 0
            ? {
                value: Math.abs(calorieTrend),
                isPositive: calorieTrend < 0,
              }
            : undefined
        }
      />
      <StatCard
        title={t.dashboard.stats.waterIntake.title}
        value={`${waterIntake} / ${waterGoal}`}
        subtitle={t.dashboard.stats.waterIntake.subtitle}
        icon={Droplets}
      />
      <StatCard
        title={t.dashboard.stats.dietScore.title}
        value={dietScore}
        subtitle={t.dashboard.stats.dietScore.subtitle}
        icon={TrendingUp}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title={t.dashboard.stats.streak.title}
        value={`${streak} ${t.dashboard.stats.streak.days}`}
        subtitle={t.dashboard.stats.streak.subtitle}
        icon={TrendingUp}
      />
    </div>
  );
}
