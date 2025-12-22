"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  StatsCards,
  StatsCardsSkeleton,
} from "@/components/daily-summaries/stats-cards";
import {
  MacrosChart,
  MacrosChartSkeleton,
} from "@/components/daily-summaries/macros-chart";
import {
  WaterChart,
  WaterChartSkeleton,
} from "@/components/daily-summaries/water-chart";
import {
  DailyDetails,
  DailyDetailsSkeleton,
} from "@/components/daily-summaries/daily-details";

interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  diet_quality_score: string;
  diet_quality_explanation: string;
  created_at: string;
  updated_at: string;
}

const DailySummariesDashboard = () => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDailySummaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not found");
        setLoading(false);
        return;
      }

      let query = supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (dateRange !== "all") {
        const daysNum = parseInt(dateRange, 10);
        if (!isNaN(daysNum) && daysNum > 0) {
          const fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - daysNum + 1);
          const fromDateStr = fromDate.toISOString().split("T")[0];
          query = query.gte("date", fromDateStr);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setSummaries(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [supabase, dateRange]);

  useEffect(() => {
    fetchDailySummaries();
  }, [fetchDailySummaries]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chartData = summaries.map((s) => ({
    date: formatDate(s.date),
    Calories: s.total_calories,
    Protein: s.total_protein,
    Carbs: s.total_carbs,
    Fats: s.total_fats,
    Water: s.water_intake,
  }));

  const calculateAverage = (key: keyof DailySummary) => {
    if (summaries.length === 0) return 0;
    const sum = summaries.reduce((acc, s) => acc + (s[key] as number), 0);
    return Math.round(sum / summaries.length);
  };

  const averages = {
    calories: calculateAverage("total_calories"),
    protein: calculateAverage("total_protein"),
    carbs: calculateAverage("total_carbs"),
    water: calculateAverage("water_intake"),
  };

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-xl text-red-600">Error: {error}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
              <h1 className="text-xl font-semibold">Daily Summaries</h1>
              <p className="text-sm text-muted-foreground">
                Track your nutrition progress over time
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange("7")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === "7"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange("30")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === "30"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange("all")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                All Time
              </button>
            </div>

            {loading ? (
              <StatsCardsSkeleton />
            ) : (
              <StatsCards averages={averages} />
            )}

            {loading ? (
              <MacrosChartSkeleton />
            ) : (
              <MacrosChart data={chartData} />
            )}

            {loading ? (
              <WaterChartSkeleton />
            ) : (
              <WaterChart data={chartData} />
            )}

            {loading ? (
              <DailyDetailsSkeleton />
            ) : (
              <DailyDetails summaries={summaries} />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DailySummariesDashboard;
