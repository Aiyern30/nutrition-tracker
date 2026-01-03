"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { format, subDays } from "date-fns";
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

      const [summaryResult, weeklySleepResult, profileResult] = await Promise.all([
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
            "daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fats_goal, daily_water_goal, current_streak, weight, goal_type"
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

  // Prioritize daily logged weight, fallback to profile weight
  const weight = dailySummary?.weight || profile?.weight || 0;
  const steps = dailySummary?.steps || 0;
  const sleepHours = dailySummary?.sleep_hours || 0;
  const waterIntake = dailySummary?.water_intake || 0;
  const waterGoal = profile?.daily_water_goal || 8;

  return (
    <div className="relative">
      <div className="absolute -top-10 right-0 z-20">
        <DailyCheckIn
          currentMetrics={{
            weight,
            steps,
            sleep_hours: sleepHours,
            water_intake: waterIntake,
          }}
          onUpdate={fetchData}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Weight"
          value={`${weight} kg`}
          subtitle={
            profile?.goal_type
              ? `Goal: ${profile.goal_type.replace("_", " ")}`
              : "Current Weight"
          }
          icon={TrendingUp}
          variant="default"
          progress={
            profile?.goal_type === "maintenance"
              ? { value: 100, max: 100, color: "bg-green-500" }
              : undefined
          }
        />
        <StatCard
          title="Steps"
          value={`${steps}`}
          subtitle="steps"
          icon={Flame}
          variant="warning"
          customBg="bg-orange-100 dark:bg-orange-900/20"
          customText="text-orange-600 dark:text-orange-400"
          progress={{
            value: Math.min((steps / 10000) * 100, 100),
            max: 100,
            color: "bg-orange-500",
          }}
        />
        <StatCard
          title="Sleep"
          value={`${sleepHours}`}
          subtitle="hours"
          icon={Clock}
          variant="success"
          customBg="bg-lime-100 dark:bg-lime-900/20"
          customText="text-lime-600 dark:text-lime-400"
          barChart={true}
          chartData={weekSleepData}
        />
        <StatCard
          title="Water Intake"
          value={`${waterIntake} L`}
          subtitle={`${waterGoal} litre goal`}
          icon={Droplets}
          variant="default"
          customBg="bg-blue-100 dark:bg-blue-900/20"
          customText="text-blue-600 dark:text-blue-400"
          progress={{
            value: (waterIntake / waterGoal) * 100,
            max: 100,
            color: "bg-blue-500",
          }}
        />
      </div>
    </div>
  );
}

import { Clock } from "lucide-react";
import { DailyCheckIn } from "@/components/daily-check-in";
