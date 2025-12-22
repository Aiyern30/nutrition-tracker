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

interface WaterChartProps {
  data: Array<{
    date: string;
    Water?: number;
  }>;
  visible: boolean;
}

export function WaterChart({ data, visible }: WaterChartProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-6">
        Water Intake
      </h2>
      <ResponsiveContainer width="100%" height={200} className="md:h-62.5">
        <BarChart data={data}>
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
