"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Droplet, Activity, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  console.log("Summaries:", summaries);
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

      console.log("Fetching summaries for user ID:", user.id);

      // Query Supabase directly instead of using API route
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

      console.log("Fetched summaries:", data);
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

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-100";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your summaries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Daily Summaries
          </h1>
          <p className="text-gray-600">
            Track your nutrition progress over time
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setDateRange("7")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              dateRange === "7"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange("30")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              dateRange === "30"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              dateRange === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Time
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-orange-500" size={24} />
              <span className="text-sm text-gray-500">Avg/day</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {calculateAverage("total_calories")}
            </div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-blue-500" size={24} />
              <span className="text-sm text-gray-500">Avg/day</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {calculateAverage("total_protein")}g
            </div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-green-500" size={24} />
              <span className="text-sm text-gray-500">Avg/day</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {calculateAverage("total_carbs")}g
            </div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Droplet className="text-cyan-500" size={24} />
              <span className="text-sm text-gray-500">Avg/day</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {calculateAverage("water_intake")}
            </div>
            <div className="text-sm text-gray-600">Glasses</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Calories & Macros Trend
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Calories"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Protein"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Carbs"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Fats"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Water Intake
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="Water" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Daily Details
          </h2>
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-indigo-600" size={20} />
                    <div>
                      <div className="font-semibold text-gray-800">
                        {new Date(summary.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {summary.diet_quality_explanation ||
                          "No explanation provided."}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(
                      summary.diet_quality_score
                    )}`}
                  >
                    {summary.diet_quality_score}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-500">Calories</div>
                    <div className="text-lg font-bold text-gray-800">
                      {summary.total_calories}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Protein</div>
                    <div className="text-lg font-bold text-blue-600">
                      {summary.total_protein}g
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Carbs</div>
                    <div className="text-lg font-bold text-green-600">
                      {summary.total_carbs}g
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fats</div>
                    <div className="text-lg font-bold text-red-600">
                      {summary.total_fats}g
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Water</div>
                    <div className="text-lg font-bold text-cyan-600">
                      {summary.water_intake} 🥤
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummariesDashboard;
