"use client";

import { TrendingUp, Droplet, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface StatsCardsProps {
  averages: {
    calories?: number;
    protein?: number;
    carbs?: number;
    water?: number;
  };
  visibleMetrics: string[];
}

export function StatsCards({ averages, visibleMetrics }: StatsCardsProps) {
  const { t } = useLanguage();

  const cards = [
    {
      key: "calories",
      icon: Activity,
      color: "text-orange-500",
      label: t.dailySummaries.stats.calories,
      value: averages.calories ?? 0,
      unit: "",
    },
    {
      key: "protein",
      icon: TrendingUp,
      color: "text-blue-500",
      label: t.dailySummaries.stats.protein,
      value: averages.protein ?? 0,
      unit: "g",
    },
    {
      key: "carbs",
      icon: Activity,
      color: "text-green-500",
      label: t.dailySummaries.stats.carbs,
      value: averages.carbs ?? 0,
      unit: "g",
    },
    {
      key: "water",
      icon: Droplet,
      color: "text-cyan-500",
      label: t.dailySummaries.stats.water,
      value: averages.water ?? 0,
      unit: "",
    },
  ];

  const filteredCards = cards.filter((card) =>
    visibleMetrics.includes(card.key)
  );

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 ${
        filteredCards.length >= 3
          ? "lg:grid-cols-4"
          : "lg:grid-cols-" + filteredCards.length
      } gap-3 md:gap-4`}
    >
      {filteredCards.map((card) => (
        <div
          key={card.key}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <card.icon className={`${card.color} w-5 h-5 md:w-6 md:h-6`} />
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {t.dailySummaries.stats.avgPerDay}
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
            {card.value}
            {card.unit}
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-5 md:h-6 md:w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-12 md:h-4 md:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-8 w-16 md:h-9 md:w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-3 w-12 md:h-4 md:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
