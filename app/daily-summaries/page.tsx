"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Filter } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";
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

const ITEMS_PER_PAGE = 7; // Show 7 days per page

const DailySummariesDashboard = () => {
  useLocalizedMetadata({ page: "dailySummaries" });

  const { t } = useLanguage();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [error, setError] = useState<string | null>(null);
  // Filter only for macros chart
  const [visibleChartMetrics, setVisibleChartMetrics] = useState<string[]>([
    "calories",
    "protein",
    "carbs",
    "fats",
  ]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [paginatedSummaries, setPaginatedSummaries] = useState<DailySummary[]>(
    []
  );

  const supabase = createClient();

  const fetchDailySummaries = useCallback(
    async (showSkeleton = false) => {
      if (showSkeleton) setLoading(true);
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

        // Fetch all summaries for stats and charts (with date range filter)
        let query = supabase
          .from("daily_summaries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

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
        setTotalCount(data?.length || 0);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (showSkeleton) setLoading(false);
      }
    },
    [supabase, dateRange]
  );

  const fetchPaginatedDetails = useCallback(
    async (page: number) => {
      setDetailsLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const offset = (page - 1) * ITEMS_PER_PAGE;

        // Fetch only 7 items for the current page
        const { data, error } = await supabase
          .from("daily_summaries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);

        if (error) throw error;

        setPaginatedSummaries(data || []);
      } catch (err) {
        console.error("Fetch paginated details error:", err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [supabase]
  );
  useEffect(() => {
    fetchPaginatedDetails(1);
  }, [fetchPaginatedDetails]);

  useEffect(() => {
    fetchDailySummaries(true);
  }, [fetchDailySummaries]);

  useEffect(() => {
    // Reset to page 1 when date range changes
    setCurrentPage(1);
    fetchPaginatedDetails(1);
  }, [dateRange, fetchPaginatedDetails]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPaginatedDetails(page);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Chart data includes only visible metrics for macros chart
  const chartData = summaries.map((s) => ({
    date: formatDate(s.date),
    ...(visibleChartMetrics.includes("calories") && {
      Calories: s.total_calories,
    }),
    ...(visibleChartMetrics.includes("protein") && {
      Protein: s.total_protein,
    }),
    ...(visibleChartMetrics.includes("carbs") && { Carbs: s.total_carbs }),
    ...(visibleChartMetrics.includes("fats") && { Fats: s.total_fats }),
    Water: s.water_intake, // Water always included for water chart
  }));

  const calculateAverage = (key: keyof DailySummary) => {
    if (summaries.length === 0) return 0;
    const sum = summaries.reduce((acc, s) => acc + (s[key] as number), 0);
    return Math.round(sum / summaries.length);
  };

  // All averages shown in stats cards
  const averages = {
    calories: calculateAverage("total_calories"),
    protein: calculateAverage("total_protein"),
    carbs: calculateAverage("total_carbs"),
    water: calculateAverage("water_intake"),
  };

  const toggleChartMetric = (metric: string) => {
    setVisibleChartMetrics((prev) => {
      if (prev.includes(metric)) {
        // Don't allow unchecking if it's the last metric
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };

  // Only macros for chart filter (no water)
  const chartMetrics = [
    { key: "calories", label: t.dailySummaries.metrics.calories },
    { key: "protein", label: t.dailySummaries.metrics.protein },
    { key: "carbs", label: t.dailySummaries.metrics.carbs },
    { key: "fats", label: t.dailySummaries.metrics.fats },
  ];

  // All metrics shown in daily details
  const allVisibleMetrics = ["calories", "protein", "carbs", "fats", "water"];

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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-semibold truncate">
                {t.dailySummaries.title}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                {t.dailySummaries.subtitle}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-8">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setDateRange("7")}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition whitespace-nowrap ${
                    dateRange === "7"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {t.dailySummaries.dateRanges.last7Days}
                </button>
                <button
                  onClick={() => setDateRange("30")}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition whitespace-nowrap ${
                    dateRange === "30"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {t.dailySummaries.dateRanges.last30Days}
                </button>
                <button
                  onClick={() => setDateRange("all")}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition whitespace-nowrap ${
                    dateRange === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {t.dailySummaries.dateRanges.allTime}
                </button>
              </div>
            </div>

            {loading ? (
              <StatsCardsSkeleton />
            ) : (
              <StatsCards
                averages={averages}
                visibleMetrics={allVisibleMetrics}
              />
            )}

            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t.dailySummaries.filter.filterLines}
                  </span>
                  <span className="sm:hidden">
                    {t.dailySummaries.filter.filter}
                  </span>
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                    {visibleChartMetrics.length}
                  </span>
                </button>

                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilterDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                          {t.dailySummaries.filter.chartLines}
                        </p>
                      </div>
                      <div className="p-2 space-y-1">
                        {chartMetrics.map((metric) => (
                          <label
                            key={metric.key}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={visibleChartMetrics.includes(metric.key)}
                              onChange={() => toggleChartMetric(metric.key)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {metric.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {loading ? (
                <MacrosChartSkeleton />
              ) : (
                <MacrosChart
                  data={chartData}
                  visibleMetrics={visibleChartMetrics}
                />
              )}
            </div>

            {loading ? (
              <WaterChartSkeleton />
            ) : (
              <WaterChart data={chartData} visible={true} />
            )}

            {paginatedSummaries.length === 0 && (loading || detailsLoading) ? (
              <DailyDetailsSkeleton />
            ) : (
              <DailyDetails
                summaries={paginatedSummaries}
                visibleMetrics={allVisibleMetrics}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={detailsLoading}
              />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DailySummariesDashboard;
