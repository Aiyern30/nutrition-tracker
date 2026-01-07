"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

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
  weight: number | null;
  steps: number;
  sleep_hours: number;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

type DateFilter = "week" | "month" | "all";

const DailySummariesDashboard = () => {
  useLocalizedMetadata({ page: "dailySummaries" });

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [allSummaries, setAllSummaries] = useState<DailySummary[]>([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const ITEMS_PER_PAGE = 10;

  const supabase = createClient();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch all summaries for stats (without pagination)
  const fetchAllSummaries = useCallback(
    async (filter: DateFilter) => {
      setStatsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        let query = supabase
          .from("daily_summaries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        // Apply date filter
        if (filter !== "all") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(today);

          switch (filter) {
            case "week":
              startDate.setDate(today.getDate() - today.getDay());
              break;
            case "month":
              startDate.setDate(1);
              break;
          }

          const fromDateStr = startDate.toISOString().split("T")[0];
          query = query.gte("date", fromDateStr);
        }

        const { data, error } = await query;

        if (error) throw error;

        setAllSummaries(data || []);
      } catch (err) {
        console.error("Error fetching all summaries:", err);
        setAllSummaries([]);
      } finally {
        setStatsLoading(false);
      }
    },
    [supabase]
  );

  // Fetch paginated data with search from API
  const fetchPaginatedSummaries = useCallback(
    async (
      filter: DateFilter,
      page: number,
      search: string,
      showLoader = true
    ) => {
      if (showLoader) {
        setTableLoading(true);
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No user found in fetchPaginatedSummaries");
          return;
        }

        console.log("Fetching paginated summaries:", { user_id: user.id, filter, page, search, limit: ITEMS_PER_PAGE });

        // Build API URL with query parameters
        const params = new URLSearchParams({
          user_id: user.id,
          filter: filter,
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        if (search && search.trim()) {
          params.append("search", search.trim());
        }

        const url = `/api/daily-summaries?${params.toString()}`;
        console.log("API URL:", url);

        const response = await fetch(url);
        const result = await response.json();

        console.log("API Response:", { 
          ok: response.ok, 
          status: response.status,
          dataLength: result.data?.length,
          pagination: result.pagination,
          error: result.error
        });

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch data");
        }

        setSummaries(result.data || []);
        setPagination(
          result.pagination || {
            page: 1,
            limit: ITEMS_PER_PAGE,
            total: 0,
            totalPages: 0,
            hasMore: false,
          }
        );

        console.log(`Successfully fetched page ${page}: ${result.data?.length || 0} items, total: ${result.pagination?.total || 0}`);
      } catch (err) {
        console.error("Error fetching paginated summaries:", err);
        setSummaries([]);
        setPagination({
          page: 1,
          limit: ITEMS_PER_PAGE,
          total: 0,
          totalPages: 0,
          hasMore: false,
        });
      } finally {
        if (showLoader) {
          setTableLoading(false);
        }
      }
    },
    [supabase]
  );

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      console.log("Initial load started");
      setLoading(true);
      
      try {
        // Fetch both in parallel
        await Promise.all([
          fetchAllSummaries(dateFilter),
          fetchPaginatedSummaries(dateFilter, 1, "", false),
        ]);
        console.log("Initial load completed successfully");
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Refetch when filter, page, or search changes (skip initial load)
  useEffect(() => {
    if (isInitialLoad) {
      console.log("Skipping refetch - initial load");
      return;
    }

    console.log("Refetching table data:", { dateFilter, currentPage, debouncedSearch });
    fetchPaginatedSummaries(dateFilter, currentPage, debouncedSearch, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, currentPage, debouncedSearch]);

  // Refetch stats when filter changes (skip initial load)
  useEffect(() => {
    if (isInitialLoad) {
      console.log("Skipping stats refetch - initial load");
      return;
    }

    console.log("Refetching stats:", dateFilter);
    fetchAllSummaries(dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  // Handle date filter change
  const handleDateFilterChange = useCallback(
    (newFilter: DateFilter) => {
      setDateFilter(newFilter);
      setCurrentPage(1);
      setSearchTerm("");
      setDebouncedSearch("");

      // Fetch both stats and table data
      fetchAllSummaries(newFilter);
      fetchPaginatedSummaries(newFilter, 1, "", true);
    },
    [fetchAllSummaries, fetchPaginatedSummaries]
  );

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Calculate totals for the filtered period (from all summaries)
  const periodTotals = allSummaries.reduce(
    (acc, s) => ({
      calories: acc.calories + s.total_calories,
      carbs: acc.carbs + s.total_carbs,
      protein: acc.protein + s.total_protein,
      fats: acc.fats + s.total_fats,
      water: acc.water + s.water_intake,
      steps: acc.steps + s.steps,
      sleep: acc.sleep + s.sleep_hours,
    }),
    { calories: 0, carbs: 0, protein: 0, fats: 0, water: 0, steps: 0, sleep: 0 }
  );

  // Calculate averages
  const averages =
    allSummaries.length > 0
      ? {
          calories: Math.round(periodTotals.calories / allSummaries.length),
          carbs: Math.round(periodTotals.carbs / allSummaries.length),
          protein: Math.round(periodTotals.protein / allSummaries.length),
          fats: Math.round(periodTotals.fats / allSummaries.length),
          water: Math.round(periodTotals.water / allSummaries.length),
          steps: Math.round(periodTotals.steps / allSummaries.length),
          sleep: Math.round(periodTotals.sleep / allSummaries.length),
        }
      : {
          calories: 0,
          carbs: 0,
          protein: 0,
          fats: 0,
          water: 0,
          steps: 0,
          sleep: 0,
        };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getScoreColor = (score: string) => {
    switch (score.toUpperCase()) {
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "D":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "F":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPeriodLabel = () => {
    switch (dateFilter) {
      case "week":
        return "This week";
      case "month":
        return "This month";
      case "all":
        return "All time";
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex items-center justify-between flex-1">
            <h1 className="text-xl font-semibold">Daily Summaries</h1>
            {(statsLoading || tableLoading) && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                Loading...
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                      {dateFilter === "all" ? "Total Calories" : "Avg Calories"}
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {statsLoading ? (
                        <span className="inline-block w-20 h-9 bg-green-200 dark:bg-green-800 animate-pulse rounded"></span>
                      ) : dateFilter === "all" ? (
                        periodTotals.calories.toLocaleString()
                      ) : (
                        averages.calories.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      kcal {dateFilter !== "all" && "per day"}
                    </p>
                  </div>
                  <div className="bg-green-500 rounded-xl p-3">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                  {getPeriodLabel()} • {allSummaries.length} days
                </p>
              </div>

              <div className="bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-1">
                      {dateFilter === "all" ? "Total Carbs" : "Avg Carbs"}
                    </p>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                      {statsLoading ? (
                        <span className="inline-block w-20 h-9 bg-amber-200 dark:bg-amber-800 animate-pulse rounded"></span>
                      ) : dateFilter === "all" ? (
                        periodTotals.carbs.toLocaleString()
                      ) : (
                        averages.carbs.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      gr {dateFilter !== "all" && "per day"}
                    </p>
                  </div>
                  <div className="bg-amber-500 rounded-xl p-3">
                    <span className="text-2xl">🍞</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                  {getPeriodLabel()} • {allSummaries.length} days
                </p>
              </div>

              <div className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">
                      {dateFilter === "all" ? "Total Protein" : "Avg Protein"}
                    </p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {statsLoading ? (
                        <span className="inline-block w-20 h-9 bg-orange-200 dark:bg-orange-800 animate-pulse rounded"></span>
                      ) : dateFilter === "all" ? (
                        periodTotals.protein.toLocaleString()
                      ) : (
                        averages.protein.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      gr {dateFilter !== "all" && "per day"}
                    </p>
                  </div>
                  <div className="bg-orange-500 rounded-xl p-3">
                    <span className="text-2xl">🥩</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                  {getPeriodLabel()} • {allSummaries.length} days
                </p>
              </div>

              <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                      {dateFilter === "all" ? "Total Fats" : "Avg Fats"}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {statsLoading ? (
                        <span className="inline-block w-20 h-9 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></span>
                      ) : dateFilter === "all" ? (
                        periodTotals.fats.toLocaleString()
                      ) : (
                        averages.fats.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      gr {dateFilter !== "all" && "per day"}
                    </p>
                  </div>
                  <div className="bg-gray-500 rounded-xl p-3">
                    <span className="text-2xl">🥑</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {getPeriodLabel()} • {allSummaries.length} days
                </p>
              </div>
            </div>

            {/* Search and Date Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by date or quality score..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {searchTerm !== debouncedSearch
                      ? "Typing..."
                      : `${pagination.total} results`}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDateFilterChange("week")}
                  disabled={statsLoading || tableLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    dateFilter === "week"
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  This Week
                </button>
                <button
                  onClick={() => handleDateFilterChange("month")}
                  disabled={statsLoading || tableLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    dateFilter === "month"
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  This Month
                </button>
                <button
                  onClick={() => handleDateFilterChange("all")}
                  disabled={statsLoading || tableLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    dateFilter === "all"
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Calories
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Protein
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Carbs
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Fats
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Water
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Steps
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Sleep
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Quality
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading || tableLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          </td>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j} className="px-6 py-4 text-center">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : summaries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">No data found</p>
                            <p className="text-sm">
                              {debouncedSearch
                                ? `No results for "${debouncedSearch}"`
                                : `No entries for ${getPeriodLabel().toLowerCase()}`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      summaries.map((summary) => (
                        <tr
                          key={summary.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(summary.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.total_calories}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              kcal
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.total_protein}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              g
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.total_carbs}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              g
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.total_fats}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              g
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.water_intake}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              L
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.steps.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {summary.sleep_hours}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              hrs
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {summary.weight ? (
                              <>
                                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                  {summary.weight}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  kg
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-600">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(
                                summary.diet_quality_score
                              )}`}
                            >
                              {summary.diet_quality_score}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handlePageChange(Math.max(1, pagination.page - 1))
                      }
                      disabled={pagination.page === 1 || tableLoading}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={tableLoading}
                            className={`w-10 h-10 rounded-lg text-sm font-medium disabled:opacity-50 ${
                              pagination.page === pageNum
                                ? "bg-green-600 text-white"
                                : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        handlePageChange(
                          Math.min(pagination.totalPages, pagination.page + 1)
                        )
                      }
                      disabled={
                        pagination.page === pagination.totalPages ||
                        tableLoading
                      }
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DailySummariesDashboard;
