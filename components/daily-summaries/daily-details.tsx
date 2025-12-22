"use client";

import { Calendar } from "lucide-react";

interface DailySummary {
  id: string;
  date: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fats?: number;
  water_intake?: number;
  diet_quality_score: string;
  diet_quality_explanation: string;
}

interface DailyDetailsProps {
  summaries: DailySummary[];
  visibleMetrics: string[];
}

const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-green-600 bg-green-100";
  if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
  if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

export function DailyDetails({ summaries, visibleMetrics }: DailyDetailsProps) {
  if (summaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-6">
          Daily Details
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available for the selected period
        </div>
      </div>
    );
  }

  const metrics = [
    {
      key: "calories",
      label: "Calories",
      field: "total_calories",
      unit: "",
      color: "text-gray-800 dark:text-gray-200",
    },
    {
      key: "protein",
      label: "Protein",
      field: "total_protein",
      unit: "g",
      color: "text-blue-600",
    },
    {
      key: "carbs",
      label: "Carbs",
      field: "total_carbs",
      unit: "g",
      color: "text-green-600",
    },
    {
      key: "fats",
      label: "Fats",
      field: "total_fats",
      unit: "g",
      color: "text-red-600",
    },
    {
      key: "water",
      label: "Water",
      field: "water_intake",
      unit: " 🥤",
      color: "text-cyan-600",
    },
  ];

  const visibleMetricsList = metrics.filter((m) =>
    visibleMetrics.includes(m.key)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-6">
        Daily Details
      </h2>
      <div className="space-y-3 md:space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-5 hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                <Calendar className="text-indigo-600 shrink-0 w-4 h-4 md:w-5 md:h-5 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-200 truncate">
                    {new Date(summary.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {summary.diet_quality_explanation ||
                      "No explanation provided."}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold shrink-0 self-start ${getGradeColor(
                  summary.diet_quality_score
                )}`}
              >
                {summary.diet_quality_score}
              </span>
            </div>

            {visibleMetricsList.length > 0 && (
              <div
                className={`grid grid-cols-2 ${
                  visibleMetricsList.length >= 3
                    ? "md:grid-cols-5"
                    : "md:grid-cols-" + visibleMetricsList.length
                } gap-3 md:gap-4 mt-3 md:mt-4`}
              >
                {visibleMetricsList.map((metric) => {
                  const value = summary[metric.field as keyof DailySummary];
                  if (value === undefined) return null;

                  return (
                    <div key={metric.key}>
                      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {metric.label}
                      </div>
                      <div
                        className={`text-base md:text-lg font-bold ${metric.color}`}
                      >
                        {value}
                        {metric.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DailyDetailsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <div className="h-6 md:h-8 w-36 md:w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 md:mb-6" />
      <div className="space-y-3 md:space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 md:gap-3 flex-1">
                <div className="h-4 w-4 md:h-5 md:w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 md:h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 md:h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 md:h-6 w-10 md:w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse shrink-0" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-3 md:mt-4">
              {[...Array(5)].map((_, j) => (
                <div key={j}>
                  <div className="h-3 md:h-4 w-12 md:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-5 md:h-6 w-10 md:w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
