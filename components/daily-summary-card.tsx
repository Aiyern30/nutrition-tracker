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

  // Translation object for status messages
  const statusTranslations = {
    overGoal: t.dashboard.todaysSummary.overGoal,
    remaining: t.dashboard.todaysSummary.remaining,
    optimal: t.dashboard.todaysSummary.optimal,
    aboveRecommended: t.dashboard.todaysSummary.aboveRecommended,
    belowTarget: t.dashboard.todaysSummary.belowTarget,
    toGo: t.dashboard.todaysSummary.remaining,
    goalReached: t.dashboard.todaysSummary.goalReached,
    goalAchieved: t.dashboard.todaysSummary.goalReached,
    noGoalSet: t.dashboard.todaysSummary.noGoalSet,
  };

  return (
    <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-primary/20">
      <CardHeader>
        <CardTitle>{t.dashboard.todaysSummary.title}</CardTitle>
        <CardDescription>
          {t.dashboard.todaysSummary.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around py-6">
            {/* Calorie Ring Skeleton */}
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-48 w-48 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>

            {/* Macro Bars Skeleton */}
            <div className="w-full max-w-md space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
            <CalorieRing
              consumed={consumedCalories}
              goal={calorieGoal}
              translations={{
                of: t.common.of,
                overGoal: t.dashboard.todaysSummary.overGoal,
                remaining: t.dashboard.todaysSummary.remaining,
                onTrack: t.dashboard.stats.dietScore.subtitle,
                progress: t.common.progress,
              }}
            />
            <div className="w-full max-w-md space-y-4">
              <MacroBar
                label={t.dashboard.todaysSummary.protein}
                current={consumedProtein}
                goal={proteinGoal}
                color={getProgressColor(
                  consumedProtein,
                  proteinGoal,
                  "protein"
                )}
                statusMessage={getStatusMessage(
                  consumedProtein,
                  proteinGoal,
                  "protein",
                  statusTranslations
                )}
              />
              <MacroBar
                label={t.dashboard.todaysSummary.carbs}
                current={consumedCarbs}
                goal={carbsGoal}
                color={getProgressColor(consumedCarbs, carbsGoal, "carbs")}
                statusMessage={getStatusMessage(
                  consumedCarbs,
                  carbsGoal,
                  "carbs",
                  statusTranslations
                )}
              />
              <MacroBar
                label={t.dashboard.todaysSummary.fats}
                current={consumedFats}
                goal={fatsGoal}
                color={getProgressColor(consumedFats, fatsGoal, "fats")}
                statusMessage={getStatusMessage(
                  consumedFats,
                  fatsGoal,
                  "fats",
                  statusTranslations
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
