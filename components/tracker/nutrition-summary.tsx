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
import { getTextColor, getBarColor } from "@/lib/utils/nutrition-colors";

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
              <span className={cn("text-sm font-medium", getTextColor(totalCalories, calorieGoal, "calories"))}>
                {totalCalories} / {calorieGoal}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", getBarColor(totalCalories, calorieGoal, "calories"))}
                style={{
                  width: `${Math.min((totalCalories / calorieGoal) * 100, 100)}%`,
                }}
              />
            </div>
            {totalCalories > calorieGoal && (
              <p className="text-xs text-red-500 font-medium">
                +{totalCalories - calorieGoal} {t.dashboard.todaysSummary.overGoal}
              </p>
            )}
          </div>

          {/* Protein */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {t.tracker.summary.protein}
              </span>
              <span className={cn("text-sm font-medium", getTextColor(totalProtein, proteinGoal, "protein"))}>
                {totalProtein} / {proteinGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", getBarColor(totalProtein, proteinGoal, "protein"))}
                style={{
                  width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%`,
                }}
              />
            </div>
            {totalProtein > proteinGoal && (
              <p className="text-xs text-red-500 font-medium">
                +{totalProtein - proteinGoal}g {t.dashboard.todaysSummary.overGoal}
              </p>
            )}
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {t.tracker.summary.carbs}
              </span>
              <span className={cn("text-sm font-medium", getTextColor(totalCarbs, carbsGoal, "carbs"))}>
                {totalCarbs} / {carbsGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", getBarColor(totalCarbs, carbsGoal, "carbs"))}
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
              <span className={cn("text-sm font-medium", getTextColor(totalFats, fatsGoal, "fats"))}>
                {totalFats} / {fatsGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", getBarColor(totalFats, fatsGoal, "fats"))}
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
