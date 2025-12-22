"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "next-themes";

interface WaterChartProps {
  data: Array<{
    date: string;
    Water?: number;
  }>;
  visible: boolean;
}

export function WaterChart({ data, visible }: WaterChartProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!visible) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-6">
        {t.dailySummaries.charts.waterIntake}
      </h2>
      <ResponsiveContainer width="100%" height={200} className="md:h-62.5">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#374151" : "#f0f0f0"}
          />
          <XAxis
            dataKey="date"
            stroke={isDark ? "#9ca3af" : "#6b7280"}
            tick={{ fontSize: 12, fill: isDark ? "#9ca3af" : "#6b7280" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke={isDark ? "#9ca3af" : "#6b7280"}
            tick={{ fontSize: 12, fill: isDark ? "#9ca3af" : "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#fff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "8px",
              fontSize: "12px",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
            labelStyle={{
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          />
          <Bar dataKey="Water" fill="#06b6d4" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WaterChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <div className="h-6 md:h-8 w-36 md:w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 md:mb-6" />
      <div className="h-50 md:h-62.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}
