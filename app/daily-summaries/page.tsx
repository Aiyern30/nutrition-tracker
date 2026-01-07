"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Check,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

const ALL_COLUMNS = [
  { id: "calories", label: "Calories" },
  { id: "protein", label: "Protein" },
  { id: "carbs", label: "Carbs" },
  { id: "fats", label: "Fats" },
  { id: "water", label: "Water" },
  { id: "steps", label: "Steps" },
  { id: "sleep", label: "Sleep" },
  { id: "weight", label: "Weight" },
];

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface FoodLog {
  id: string;
  food_name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size: string | null;
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
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.map((c) => c.id)
  );
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dailyLogs, setDailyLogs] = useState<Record<string, FoodLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<string | null>(null);
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
      metrics: string[],
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

        console.log("Fetching paginated summaries:", {
          user_id: user.id,
          filter,
          page,
          search,
          limit: ITEMS_PER_PAGE,
        });

        // Build API URL with query parameters
        const params = new URLSearchParams({
          user_id: user.id,
          filter: filter,
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          metrics: metrics.join(","),
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
          error: result.error,
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

        console.log(
          `Successfully fetched page ${page}: ${
            result.data?.length || 0
          } items, total: ${result.pagination?.total || 0}`
        );
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
          fetchPaginatedSummaries(dateFilter, 1, "", visibleColumns, false),
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

    console.log("Refetching table data:", {
      dateFilter,
      currentPage,
      debouncedSearch,
    });
    fetchPaginatedSummaries(
      dateFilter,
      currentPage,
      debouncedSearch,
      visibleColumns,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, currentPage, debouncedSearch, visibleColumns]);

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
      fetchPaginatedSummaries(newFilter, 1, "", visibleColumns, true);
    },
    [fetchAllSummaries, fetchPaginatedSummaries, visibleColumns]
  );

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    setExpandedDate(null); // Collapse when changing page
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch food logs for a specific date
  const fetchDailyLogs = async (dateStr: string) => {
    // If already loaded, just toggle
    if (dailyLogs[dateStr]) {
      return;
    }

    setLogsLoading(dateStr);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Extract just the date part YYYY-MM-DD to be safe
      const cleanDate = dateStr.split("T")[0];

      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", cleanDate)
        .order("meal_type", { ascending: true }); // Default sort, maybe refine later

      if (error) throw error;

      setDailyLogs((prev) => ({
        ...prev,
        [dateStr]: data || [],
      }));
    } catch (err) {
      console.error("Error fetching daily logs:", err);
    } finally {
      setLogsLoading(null);
    }
  };

  const toggleRow = (dateStr: string) => {
    if (expandedDate === dateStr) {
      setExpandedDate(null);
    } else {
      setExpandedDate(dateStr);
      fetchDailyLogs(dateStr);
    }
  };

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
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "B":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "C":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
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
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex items-center justify-between flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">Daily Summaries</h1>
            {(statsLoading || tableLoading) && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                Updating...
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="max-w-full mx-auto p-4 sm:p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-1">
                      {dateFilter === "all" ? "Total Calories" : "Avg Calories"}
                    </p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {statsLoading ? (
                        <span className="inline-block w-20 h-9 bg-emerald-200 dark:bg-emerald-800 animate-pulse rounded"></span>
                      ) : dateFilter === "all" ? (
                        periodTotals.calories.toLocaleString()
                      ) : (
                        averages.calories.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      kcal {dateFilter !== "all" && "per day"}
                    </p>
                  </div>
                  <div className="bg-emerald-500 rounded-xl p-3 shadow-lg shadow-emerald-500/20">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3">
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                />
                {searchTerm && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                    {searchTerm !== debouncedSearch
                      ? "..."
                      : `${pagination.total} results`}
                  </span>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <Settings2 className="w-4 h-4" />
                      <span className="hidden xs:inline">Columns</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_COLUMNS.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={visibleColumns.includes(col.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVisibleColumns([...visibleColumns, col.id]);
                          } else {
                            setVisibleColumns(
                              visibleColumns.filter((id) => id !== col.id)
                            );
                          }
                        }}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block mx-1"></div>

                <Select
                  value={dateFilter}
                  onValueChange={(value: DateFilter) =>
                    handleDateFilterChange(value)
                  }
                  disabled={statsLoading || tableLoading}
                >
                  <SelectTrigger className="w-[160px] shrink-0 text-sm font-medium border-gray-300 dark:border-gray-600 bg-white shadow-xs">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-w-0 overflow-hidden">
              <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                <Table className="min-w-[800px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-transparent">
                      <TableHead className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 z-10 shadow-[2px_0_5px_rgba(0,0,0,0,05)] h-auto">
                        Date
                      </TableHead>
                      {visibleColumns.includes("calories") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Calories
                        </TableHead>
                      )}
                      {visibleColumns.includes("protein") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Protein
                        </TableHead>
                      )}
                      {visibleColumns.includes("carbs") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Carbs
                        </TableHead>
                      )}
                      {visibleColumns.includes("fats") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Fats
                        </TableHead>
                      )}
                      {visibleColumns.includes("water") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Water
                        </TableHead>
                      )}
                      {visibleColumns.includes("steps") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Steps
                        </TableHead>
                      )}
                      {visibleColumns.includes("sleep") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Sleep
                        </TableHead>
                      )}
                      {visibleColumns.includes("weight") && (
                        <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                          Weight
                        </TableHead>
                      )}
                      <TableHead className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap h-auto">
                        Quality
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || tableLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="px-6 py-4 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-100 dark:border-gray-700">
                            <Skeleton className="h-4 w-24 sm:w-32" />
                          </TableCell>
                          {Array.from({
                            length: visibleColumns.length + 1,
                          }).map((_, j) => (
                            <TableCell
                              key={j}
                              className="px-6 py-4 text-center"
                            >
                              <Skeleton className="h-4 w-12 sm:w-16 mx-auto" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : summaries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.length + 2}
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
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaries.map((summary) => (
                        <React.Fragment key={summary.id}>
                          <TableRow
                            className={`hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer ${
                              expandedDate === summary.date
                                ? "bg-emerald-50/50 dark:bg-emerald-900/20"
                                : ""
                            }`}
                            onClick={() => toggleRow(summary.date)}
                          >
                            <TableCell className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-100 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0,05)]">
                              <div className="flex items-center gap-2">
                                {expandedDate === summary.date ? (
                                  <ChevronUp className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {formatDate(summary.date)}
                                </span>
                              </div>
                            </TableCell>
                            {visibleColumns.includes("calories") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {summary.total_calories || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    kcal
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.includes("protein") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {summary.total_protein || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    grams
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.includes("carbs") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {summary.total_carbs || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    grams
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.includes("fats") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {summary.total_fats || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    grams
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.includes("water") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {summary.water_intake || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    Liters
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.includes("steps") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                  {(summary.steps || 0).toLocaleString()}
                                </span>
                              </TableCell>
                            )}
                            {visibleColumns.includes("sleep") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {summary.sleep_hours || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    hours
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.includes("weight") && (
                              <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                {summary.weight ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                      {summary.weight}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      kg
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-300 dark:text-gray-700 font-bold">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                              <Badge
                                className={`${getScoreColor(
                                  summary.diet_quality_score
                                )} border-none shadow-none font-bold text-[11px]`}
                              >
                                {summary.diet_quality_score}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {expandedDate === summary.date && (
                            <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                              <TableCell
                                colSpan={visibleColumns.length + 2}
                                className="p-0 border-b border-emerald-100/50 dark:border-emerald-800/30"
                              >
                                <div className="px-6 py-4 bg-emerald-50/20 dark:bg-emerald-900/10 shadow-inner">
                                  {logsLoading === summary.date ? (
                                    <div className="flex items-center justify-center py-4 text-emerald-600 gap-2">
                                      <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                      <span className="text-sm font-medium">
                                        Loading meals...
                                      </span>
                                    </div>
                                  ) : !dailyLogs[summary.date] ||
                                    dailyLogs[summary.date].length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm italic">
                                      No food logs found for this day.
                                    </div>
                                  ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                      {[
                                        "breakfast",
                                        "lunch",
                                        "dinner",
                                        "snack",
                                      ].map((mealType) => {
                                        const meals = dailyLogs[
                                          summary.date
                                        ].filter(
                                          (log) => log.meal_type === mealType
                                        );
                                        if (meals.length === 0) return null;

                                        return (
                                          <div
                                            key={mealType}
                                            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 shadow-sm"
                                          >
                                            <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
                                              {mealType}
                                            </h4>
                                            <div className="space-y-2">
                                              {meals.map((meal) => (
                                                <div
                                                  key={meal.id}
                                                  className="flex justify-between items-start text-sm"
                                                >
                                                  <div
                                                    className="font-medium text-gray-700 dark:text-gray-200 line-clamp-1 mr-2"
                                                    title={meal.food_name}
                                                  >
                                                    {meal.food_name}
                                                  </div>
                                                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                                                    {meal.calories} kcal
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={tableLoading}
                          className={`w-10 h-10 rounded-lg text-sm font-medium disabled:opacity-50 transition-all ${
                            pagination.page === pageNum
                              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
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
                      pagination.page === pagination.totalPages || tableLoading
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
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DailySummariesDashboard;
