/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddFoodDialog } from "@/components/tracker/add-food-dialog";
import { MealSection } from "@/components/tracker/meal-section";
import { DateNavigation } from "@/components/tracker/date-navigation";
import { NutritionSummary } from "@/components/tracker/nutrition-summary";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";

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

interface AnalyzedFood {
  id: string;
  food_name: string;
  food_category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  serving_size: string | null;
  is_favorite: boolean;
  created_at: string;
}

interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  diet_quality_score: string;
}

interface Profile {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
  daily_water_goal: number;
}

export default function TrackerPage() {
  useLocalizedMetadata({ page: "tracker" });

  const { t } = useLanguage();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    water_intake: 0,
    diet_quality_score: "B",
  });
  const supabase = createClient();

  // Fetch profile goals
  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fats_goal, daily_water_goal"
        )
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [supabase]);

  // Fetch daily summary from daily_summaries table
  const fetchDailySummary = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .single();

      if (error) {
        // If no summary exists yet, use zeros
        if (error.code === "PGRST116") {
          setDailySummary({
            total_calories: 0,
            total_protein: 0,
            total_carbs: 0,
            total_fats: 0,
            water_intake: 0,
            diet_quality_score: "B",
          });
        } else {
          throw error;
        }
      } else if (data) {
        setDailySummary({
          total_calories: data.total_calories || 0,
          total_protein: data.total_protein || 0,
          total_carbs: data.total_carbs || 0,
          total_fats: data.total_fats || 0,
          water_intake: data.water_intake || 0,
          diet_quality_score: data.diet_quality_score || "B",
        });
      }
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    }
  }, [supabase, selectedDate]);

  const fetchFoodLogs = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mappedEntries: FoodEntry[] =
        data?.map((log: any) => ({
          id: log.id,
          name: log.food_name,
          calories: log.calories,
          protein: log.protein || 0,
          carbs: log.carbs || 0,
          fats: log.fats || 0,
          fiber: log.fiber || 0,
          sugar: log.sugar || 0,
          sodium: log.sodium || 0,
          mealType: log.meal_type as "breakfast" | "lunch" | "dinner" | "snack",
          analyzedFoodId: log.analyzed_food_id,
        })) || [];

      setEntries(mappedEntries);
    } catch (error) {
      console.error("Error fetching food logs:", error);
    }
  }, [supabase, selectedDate]);

  useEffect(() => {
    fetchProfile();
    fetchFoodLogs();
    fetchDailySummary();
  }, [fetchProfile, fetchFoodLogs, fetchDailySummary]);

  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const proteinGoal = profile?.daily_protein_goal || 150;
  const carbsGoal = profile?.daily_carbs_goal || 250;
  const fatsGoal = profile?.daily_fats_goal || 65;
  const waterGoal = profile?.daily_water_goal || 8;

  const getEntriesByMealType = (mealType: string) =>
    entries.filter((e) => e.mealType === mealType);

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;

      setEntries(entries.filter((e) => e.id !== id));

      // Refetch summary after delete - trigger will auto-update it
      await fetchDailySummary();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const handleAddFoodToMeal = async (
    food: AnalyzedFood | any,
    mealType: string,
    isManual: boolean
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split("T")[0];

      const insertData = {
        user_id: user.id,
        analyzed_food_id: isManual ? null : food.id,
        date: dateStr,
        meal_type: mealType,
        food_name: food.food_name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
        sugar: food.sugar,
        sodium: food.sodium,
        serving_size: food.serving_size,
      };

      const { data, error } = await supabase
        .from("food_logs")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newEntry: FoodEntry = {
          id: data.id,
          name: data.food_name,
          calories: data.calories,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fats: data.fats || 0,
          fiber: data.fiber || 0,
          sugar: data.sugar || 0,
          sodium: data.sodium || 0,
          mealType: data.meal_type as
            | "breakfast"
            | "lunch"
            | "dinner"
            | "snack",
          analyzedFoodId: data.analyzed_food_id,
        };
        setEntries([...entries, newEntry]);

        // Refetch summary after insert - trigger will auto-update it
        await fetchDailySummary();
      }
    } catch (error) {
      console.error("Error adding food to meal:", error);
    }
  };

  const handleWaterChange = async (delta: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split("T")[0];
      const newWaterIntake = Math.max(0, dailySummary.water_intake + delta);

      // Update or insert daily_summaries record
      const { error } = await supabase
        .from("daily_summaries")
        .upsert(
          {
            user_id: user.id,
            date: dateStr,
            water_intake: newWaterIntake,
            total_calories: dailySummary.total_calories,
            total_protein: dailySummary.total_protein,
            total_carbs: dailySummary.total_carbs,
            total_fats: dailySummary.total_fats,
            diet_quality_score: dailySummary.diet_quality_score,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,date",
          }
        );

      if (error) throw error;

      // Update local state
      setDailySummary({
        ...dailySummary,
        water_intake: newWaterIntake,
      });
    } catch (error) {
      console.error("Error updating water intake:", error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{t.tracker.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t.tracker.subtitle}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddFoodOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t.tracker.addFood}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={changeDate}
          />

          <NutritionSummary
            totalCalories={dailySummary.total_calories}
            totalProtein={dailySummary.total_protein}
            totalCarbs={dailySummary.total_carbs}
            totalFats={dailySummary.total_fats}
            waterIntake={dailySummary.water_intake}
            calorieGoal={calorieGoal}
            proteinGoal={proteinGoal}
            carbsGoal={carbsGoal}
            fatsGoal={fatsGoal}
            waterGoal={waterGoal}
            onWaterChange={handleWaterChange}
          />

          <div className="space-y-4">
            <MealSection
              mealType="breakfast"
              title={t.tracker.meals.breakfast}
              mealEntries={getEntriesByMealType("breakfast")}
              onDeleteEntry={handleDeleteEntry}
            />
            <MealSection
              mealType="lunch"
              title={t.tracker.meals.lunch}
              mealEntries={getEntriesByMealType("lunch")}
              onDeleteEntry={handleDeleteEntry}
            />
            <MealSection
              mealType="dinner"
              title={t.tracker.meals.dinner}
              mealEntries={getEntriesByMealType("dinner")}
              onDeleteEntry={handleDeleteEntry}
            />
            <MealSection
              mealType="snack"
              title={t.tracker.meals.snacks}
              mealEntries={getEntriesByMealType("snack")}
              onDeleteEntry={handleDeleteEntry}
            />
          </div>
        </main>

        <AddFoodDialog
          onAddFood={handleAddFoodToMeal}
          isOpen={isAddFoodOpen}
          onOpenChange={setIsAddFoodOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
