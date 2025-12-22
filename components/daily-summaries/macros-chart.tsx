"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/contexts/language-context";

interface MacrosChartProps {
  data: Array<{
    date: string;
    Calories?: number;
    Protein?: number;
    Carbs?: number;
    Fats?: number;
  }>;
  visibleMetrics: string[];
}

export function MacrosChart({ data, visibleMetrics }: MacrosChartProps) {
  const { t } = useLanguage();

  const metrics = [
    { key: "Calories", stroke: "#f59e0b", strokeWidth: 3, dotR: 4 },
    { key: "Protein", stroke: "#3b82f6", strokeWidth: 2, dotR: 3 },
    { key: "Carbs", stroke: "#10b981", strokeWidth: 2, dotR: 3 },
    { key: "Fats", stroke: "#ef4444", strokeWidth: 2, dotR: 3 },
  ];

  const visibleLines = metrics.filter((m) =>
    visibleMetrics.includes(m.key.toLowerCase())
  );

  if (visibleLines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-6">
          {t.dailySummaries.charts.macrosTrend}
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          {t.dailySummaries.charts.noMetricsSelected}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-6">
        {t.dailySummaries.charts.macrosTrend}
      </h2>
      <ResponsiveContainer width="100%" height={300} className="md:h-87.5">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {visibleLines.map((metric) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              stroke={metric.stroke}
              strokeWidth={metric.strokeWidth}
              dot={{ r: metric.dotR }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MacrosChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <div className="h-6 md:h-8 w-48 md:w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 md:mb-6" />
      <div className="h-75 md:h-87.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}
