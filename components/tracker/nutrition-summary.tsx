"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Summary</CardTitle>
            <CardDescription>Your nutrition progress today</CardDescription>
          </div>
          {totalCalories === 0 && (
            <Badge variant="outline" className="text-xs">
              No meals logged yet
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Calories</span>
              <span
                className={`text-sm ${
                  totalCalories > calorieGoal
                    ? "text-destructive"
                    : totalCalories > calorieGoal * 0.9
                    ? "text-accent"
                    : "text-primary"
                }`}
              >
                {totalCalories} / {calorieGoal}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  totalCalories > calorieGoal
                    ? "bg-destructive"
                    : totalCalories > calorieGoal * 0.9
                    ? "bg-accent"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(
                    (totalCalories / calorieGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Protein</span>
              <span className="text-sm text-primary">
                {totalProtein} / {proteinGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    (totalProtein / proteinGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Carbs</span>
              <span className="text-sm text-primary">
                {totalCarbs} / {carbsGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{
                  width: `${Math.min((totalCarbs / carbsGoal) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Fats</span>
              <span className="text-sm text-chart-3">
                {totalFats} / {fatsGoal}g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-3 transition-all"
                style={{
                  width: `${Math.min((totalFats / fatsGoal) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
