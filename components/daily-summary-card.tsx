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
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";

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

export function DailySummaryCard() {
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
          .select("total_calories, total_protein, total_carbs, total_fats")
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

  const consumedProtein = dailySummary?.total_protein || 0;
  const proteinGoal = profile?.daily_protein_goal || 150;

  const consumedCarbs = dailySummary?.total_carbs || 0;
  const carbsGoal = profile?.daily_carbs_goal || 200;

  const consumedFats = dailySummary?.total_fats || 0;
  const fatsGoal = profile?.daily_fats_goal || 65;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t.dashboard.todaysSummary.title}</CardTitle>
        <CardDescription>
          {t.dashboard.todaysSummary.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
            <CalorieRing consumed={consumedCalories} goal={calorieGoal} />
            <div className="w-full max-w-md space-y-4">
              <MacroBar
                label={t.dashboard.todaysSummary.protein}
                current={consumedProtein}
                goal={proteinGoal}
                color="primary"
              />
              <MacroBar
                label={t.dashboard.todaysSummary.carbs}
                current={consumedCarbs}
                goal={carbsGoal}
                color="accent"
              />
              <MacroBar
                label={t.dashboard.todaysSummary.fats}
                current={consumedFats}
                goal={fatsGoal}
                color="chart-3"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
