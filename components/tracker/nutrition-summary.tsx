"use client";

import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NutritionSummaryProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
}

export function NutritionSummary({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFats,
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatsGoal,
}: NutritionSummaryProps) {
  const { t } = useLanguage();

  // Helper function to get color classes based on progress
  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (current > goal) return "destructive";
    if (percentage >= 90) return "success";
    if (percentage >= 75) return "warning";
    return "primary";
  };

  const getTextColor = (current: number, goal: number) => {
    const colorType = getProgressColor(current, goal);
    return {
      destructive: "text-red-500",
      success: "text-green-500",
      warning: "text-yellow-500",
      primary: "text-primary",
    }[colorType];
  };

  const getBarColor = (current: number, goal: number) => {
    const colorType = getProgressColor(current, goal);
    return {
      destructive: "bg-red-500 animate-pulse",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      primary: "bg-primary",
    }[colorType];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.tracker.summary.title}</CardTitle>
            <CardDescription>{t.tracker.summary.subtitle}</CardDescription>
          </div>
          {totalCalories === 0 && (
            <Badge variant="outline" className="text-xs">
              {t.tracker.summary.noMeals}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Calories */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {t.tracker.summary.calories}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  getTextColor(totalCalories, calorieGoal)
                )}
              >
                {totalCalories} / {calorieGoal}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  getBarColor(totalCalories, calorieGoal)
                )}
                style={{
                  width: `${Math.min(
                    (totalCalories / calorieGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            {totalCalories > calorieGoal && (
              <p className="text-xs text-red-500 font-medium">
                +{totalCalories - calorieGoal}{" "}
                {t.dashboard.todaysSummary.overGoal}
              </p>
            )}
          </div>

          {/* Protein */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {t.tracker.summary.protein}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  getTextColor(totalProtein, proteinGoal)
                )}
              >
                {totalProtein} / {proteinGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  getBarColor(totalProtein, proteinGoal)
                )}
                style={{
                  width: `${Math.min(
                    (totalProtein / proteinGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            {totalProtein > proteinGoal && (
              <p className="text-xs text-red-500 font-medium">
                +{totalProtein - proteinGoal}g{" "}
                {t.dashboard.todaysSummary.overGoal}
              </p>
            )}
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {t.tracker.summary.carbs}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  getTextColor(totalCarbs, carbsGoal)
                )}
              >
                {totalCarbs} / {carbsGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  getBarColor(totalCarbs, carbsGoal)
                )}
                style={{
                  width: `${Math.min((totalCarbs / carbsGoal) * 100, 100)}%`,
                }}
              />
            </div>
            {totalCarbs > carbsGoal && (
              <p className="text-xs text-red-500 font-medium">
                +{totalCarbs - carbsGoal}g {t.dashboard.todaysSummary.overGoal}
              </p>
            )}
          </div>

          {/* Fats */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {t.tracker.summary.fats}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  getTextColor(totalFats, fatsGoal)
                )}
              >
                {totalFats} / {fatsGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  getBarColor(totalFats, fatsGoal)
                )}
                style={{
                  width: `${Math.min((totalFats / fatsGoal) * 100, 100)}%`,
                }}
              />
            </div>
            {totalFats > fatsGoal && (
              <p className="text-xs text-red-500 font-medium">
                +{totalFats - fatsGoal}g {t.dashboard.todaysSummary.overGoal}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
