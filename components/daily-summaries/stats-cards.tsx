"use client";

import { TrendingUp, Droplet, Activity } from "lucide-react";

interface StatsCardsProps {
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    water: number;
  };
}

export function StatsCards({ averages }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Activity className="text-orange-500" size={24} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Avg/day
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          {averages.calories}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="text-blue-500" size={24} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Avg/day
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          {averages.protein}g
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Activity className="text-green-500" size={24} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Avg/day
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          {averages.carbs}g
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Droplet className="text-cyan-500" size={24} />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Avg/day
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          {averages.water}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Glasses</div>
      </div>
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
