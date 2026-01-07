"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
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

type DateFilter = "week" | "month" | "all";

const DailySummariesDashboard = () => {
  useLocalizedMetadata({ page: "dailySummaries" });

  const { t } = useLanguage();
  console.log("Translations:", t);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const supabase = createClient();

  const getDateRange = (filter: DateFilter) => {
    const today = new Date();
    const startDate = new Date();

    switch (filter) {
      case "week":
        // Start of current week (Sunday)
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case "month":
        // Start of current month
        startDate.setDate(1);
        break;
      case "all":
        // No filter
        return null;
    }

    return startDate.toISOString().split("T")[0];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
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

      const startDate = getDateRange(dateFilter);
      if (startDate) {
        query = query.gte("date", startDate);
      }

      const { data: summariesData, error } = await query;

      if (error) throw error;

      setSummaries(summariesData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals for the filtered period
  const periodTotals = summaries.reduce(
    (acc, s) => ({
      calories: acc.calories + s.total_calories,
      carbs: acc.carbs + s.total_carbs,
      protein: acc.protein + s.total_protein,
      fats: acc.fats + s.total_fats,
    }),
    { calories: 0, carbs: 0, protein: 0, fats: 0 }
  );

  // Filter by search term
  const filteredSummaries = summaries.filter((s) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      s.date.toLowerCase().includes(searchLower) ||
      s.diet_quality_score.toLowerCase().includes(searchLower) ||
      s.diet_quality_explanation?.toLowerCase().includes(searchLower)
    );
  });

  // Paginate
  const totalPages = Math.ceil(filteredSummaries.length / ITEMS_PER_PAGE);
  const paginatedSummaries = filteredSummaries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchTerm]);

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold">Daily Summaries</h1>
        </header>

        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                      Total Calories
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {periodTotals.calories.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      kcal
                    </p>
                  </div>
                  <div className="bg-green-500 rounded-xl p-3">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                  {dateFilter === "week"
                    ? "This week"
                    : dateFilter === "month"
                    ? "This month"
                    : "All time"}
                </p>
              </div>

              <div className="bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-1">
                      Total Carbs
                    </p>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                      {periodTotals.carbs.toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      gr
                    </p>
                  </div>
                  <div className="bg-amber-500 rounded-xl p-3">
                    <span className="text-2xl">🍞</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                  {dateFilter === "week"
                    ? "This week"
                    : dateFilter === "month"
                    ? "This month"
                    : "All time"}
                </p>
              </div>

              <div className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">
                      Total Protein
                    </p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {periodTotals.protein.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      gr
                    </p>
                  </div>
                  <div className="bg-orange-500 rounded-xl p-3">
                    <span className="text-2xl">🥩</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                  {dateFilter === "week"
                    ? "This week"
                    : dateFilter === "month"
                    ? "This month"
                    : "All time"}
                </p>
              </div>

              <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                      Total Fats
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {periodTotals.fats.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      gr
                    </p>
                  </div>
                  <div className="bg-gray-500 rounded-xl p-3">
                    <span className="text-2xl">🥑</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {dateFilter === "week"
                    ? "This week"
                    : dateFilter === "month"
                    ? "This month"
                    : "All time"}
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
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDateFilter("week")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === "week"
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  This Week
                </button>
                <button
                  onClick={() => setDateFilter("month")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === "month"
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  This Month
                </button>
                <button
                  onClick={() => setDateFilter("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                    {loading ? (
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
                    ) : paginatedSummaries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">No data found</p>
                            <p className="text-sm">
                              Try adjusting your filters or add new entries
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedSummaries.map((summary) => (
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredSummaries.length
                    )}{" "}
                    of {filteredSummaries.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            currentPage === pageNum
                              ? "bg-green-600 text-white"
                              : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
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
