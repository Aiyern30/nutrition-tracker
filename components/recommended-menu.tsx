"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, ChefHat, Clock, Flame } from "lucide-react";

interface MealPlan {
  id: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description: string;
  items: string[];
}

export function RecommendedMenu() {
  const { t } = useLanguage();
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMealPlan() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("meal_plans")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today);

        if (data) {
          // Sort meals by order: breakfast, lunch, snack, dinner
          const order = { breakfast: 1, lunch: 2, snack: 3, dinner: 4 };
          const sorted = data.sort(
            (a: MealPlan, b: MealPlan) =>
              (order[a.meal_type as keyof typeof order] || 99) -
              (order[b.meal_type as keyof typeof order] || 99)
          );
          setMeals(sorted);
        }
      } catch (error) {
        console.error("Error fetching meal plan:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMealPlan();
  }, [supabase]);

  if (loading) {
    return <MenuSkeleton />;
  }

  if (meals.length === 0) {
    return (
      <Card className="col-span-full shadow-sm border border-border/50 rounded-[2rem] bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            {t.dashboard.recommendedMenu.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground min-h-[200px]">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <Utensils className="h-8 w-8 opacity-20" />
          </div>
          <p>{t.dashboard.recommendedMenu.noPlan}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          {t.dashboard.recommendedMenu.title}
        </h2>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {meals.map((meal) => (
          <div key={meal.id} className="h-full">
            <MealCard meal={meal} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: MealPlan }) {
  const { t } = useLanguage();
  const getMealColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "breakfast":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200";
      case "lunch":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200";
      case "snack":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200";
      case "dinner":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="group relative flex flex-col h-full overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/20">
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getMealColor(
            meal.meal_type
          )}`}
        >
          {
            (t.tracker.meals as any)[
              meal.meal_type.toLowerCase() === "snack"
                ? "snacks"
                : meal.meal_type.toLowerCase()
            ]
          }
        </span>
        <div className="flex items-center text-xs font-medium text-muted-foreground">
          <Flame className="mr-1 h-3.5 w-3.5" />
          {meal.calories} kcal
        </div>
      </div>

      <h3
        className="mb-2 text-lg font-bold leading-tight"
        title={meal.description || t.dashboard.recommendedMenu.healthyChoice}
      >
        {meal.description || t.dashboard.recommendedMenu.healthyOption}
      </h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {meal.items &&
          meal.items.slice(0, 3).map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20"
            >
              {item}
            </span>
          ))}
      </div>

      <div className="flex items-center justify-between border-t pts-4 pt-4 mt-auto">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <div title="Carbs">
            <span className="font-semibold text-foreground">{meal.carbs}g</span>{" "}
            C
          </div>
          <div title="Protein">
            <span className="font-semibold text-foreground">
              {meal.protein}g
            </span>{" "}
            P
          </div>
          <div title="Fats">
            <span className="font-semibold text-foreground">{meal.fats}g</span>{" "}
            F
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex space-x-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] w-[300px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
