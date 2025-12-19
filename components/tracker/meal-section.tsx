"use client";

import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  analyzedFoodId?: string;
}

interface MealSectionProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  mealEntries: FoodEntry[];
  onDeleteEntry: (id: string) => void;
}

export function MealSection({
  title,
  mealEntries,
  onDeleteEntry,
}: MealSectionProps) {
  const { t } = useLanguage();
  const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {mealCalories > 0 && (
              <CardDescription>
                {mealCalories} {t.tracker.meals.calories}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      {mealEntries.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            {mealEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5"
              >
                <div className="flex-1">
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.protein}g protein • {entry.carbs}g carbs •{" "}
                    {entry.fats}g fats
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{entry.calories} cal</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
