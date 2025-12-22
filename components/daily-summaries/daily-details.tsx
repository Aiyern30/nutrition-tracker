"use client";

import { Calendar } from "lucide-react";

interface DailySummary {
  id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  diet_quality_score: string;
  diet_quality_explanation: string;
}

interface DailyDetailsProps {
  summaries: DailySummary[];
}

const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-green-600 bg-green-100";
  if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
  if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

export function DailyDetails({ summaries }: DailyDetailsProps) {
  if (summaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          Daily Details
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        Daily Details
      </h2>
      <div className="space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Calendar className="text-indigo-600" size={20} />
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(summary.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
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
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Calories
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {summary.total_calories}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Protein
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {summary.total_protein}g
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Carbs
                </div>
                <div className="text-lg font-bold text-green-600">
                  {summary.total_carbs}g
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Fats
                </div>
                <div className="text-lg font-bold text-red-600">
                  {summary.total_fats}g
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Water
                </div>
                <div className="text-lg font-bold text-cyan-600">
                  {summary.water_intake} 🥤
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DailyDetailsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {[...Array(5)].map((_, j) => (
                <div key={j}>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
