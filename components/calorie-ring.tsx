"use client";

import { cn } from "@/lib/utils";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  translations?: {
    of: string;
    overGoal: string;
    remaining: string;
    onTrack: string;
    progress: string;
  };
}

export function CalorieRing({
  consumed,
  goal,
  translations = {
    of: "of",
    overGoal: "over",
    remaining: "left",
    onTrack: "On Track",
    progress: "Progress",
  },
}: CalorieRingProps) {
  const percentage = Math.min((consumed / goal) * 100, 100);
  const exceeded = consumed > goal;
  const nearGoal = percentage >= 90 && percentage <= 100;
  const remaining = Math.max(goal - consumed, 0);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine ring color based on progress
  const getRingColor = () => {
    if (exceeded) return "stroke-red-500";
    if (nearGoal) return "stroke-green-500";
    if (percentage >= 75) return "stroke-yellow-500";
    return "stroke-primary";
  };

  const getTextColor = () => {
    if (exceeded) return "text-red-500";
    if (nearGoal) return "text-green-500";
    return "text-foreground";
  };

  const getStatusText = () => {
    if (exceeded) return `⚠️ ${translations.overGoal}`;
    if (nearGoal) return `🎯 ${translations.onTrack}`;
    return `${Math.round(percentage)}% ${translations.progress}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg className="h-48 w-48 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-secondary"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "transition-all duration-500 ease-out",
              getRingColor(),
              exceeded && "animate-pulse"
            )}
            strokeLinecap="round"
          />
          {/* Exceeded indicator - full red circle overlay */}
          {exceeded && (
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={0}
              className="stroke-red-500/20"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", getTextColor())}>
            {consumed.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            {translations.of} {goal.toLocaleString()}
          </span>
          <span className={cn("text-xs font-medium mt-1", getTextColor())}>
            {exceeded
              ? `+${(consumed - goal).toLocaleString()} ${
                  translations.overGoal
                }`
              : `${remaining.toLocaleString()} ${translations.remaining}`}
          </span>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          "text-center text-sm font-medium px-3 py-1 rounded-full",
          exceeded &&
            "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
          nearGoal &&
            !exceeded &&
            "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
          !exceeded &&
            !nearGoal &&
            "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        )}
      >
        {getStatusText()}
      </div>
    </div>
  );
}
