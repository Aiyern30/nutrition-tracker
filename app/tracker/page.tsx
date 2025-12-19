/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Search,
  Star,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

const MealSection = ({
  title,
  mealEntries,
  onDeleteEntry,
}: {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  mealEntries: FoodEntry[];
  onDeleteEntry: (id: string) => void;
}) => {
  const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {mealCalories > 0 && (
              <CardDescription>{mealCalories} calories</CardDescription>
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
};

const AddFoodDialog = ({
  onAddFood,
  isOpen,
  onOpenChange,
}: {
  onAddFood: (food: AnalyzedFood | any, mealType: string, isManual: boolean) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [analyzedFoods, setAnalyzedFoods] = useState<AnalyzedFood[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<AnalyzedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "favorites">("all");
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [activeTab, setActiveTab] = useState<"analyzed" | "manual">("analyzed");
  
  // Manual entry form state
  const [manualFood, setManualFood] = useState({
    food_name: "",
    food_category: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
    sugar: "",
    sodium: "",
    serving_size: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchAnalyzedFoods();
    }
  }, [isOpen]);

  useEffect(() => {
    filterFoods();
  }, [searchQuery, filterType, analyzedFoods]);

  const fetchAnalyzedFoods = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("analyzed_foods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyzedFoods(data || []);
    } catch (error) {
      console.error("Error fetching analyzed foods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFoods = () => {
    let filtered = analyzedFoods;

    if (filterType === "favorites") {
      filtered = filtered.filter((f) => f.is_favorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.food_name.toLowerCase().includes(query) ||
          f.food_category?.toLowerCase().includes(query)
      );
    }

    setFilteredFoods(filtered);
  };

  const handleAddAnalyzedFood = (food: AnalyzedFood) => {
    onAddFood(food, selectedMealType, false);
    onOpenChange(false);
    resetForm();
  };

  const handleAddManualFood = () => {
    if (!manualFood.food_name || !manualFood.calories) {
      return;
    }

    const foodData = {
      food_name: manualFood.food_name,
      food_category: manualFood.food_category || "Custom",
      calories: parseInt(manualFood.calories) || 0,
      protein: parseInt(manualFood.protein) || 0,
      carbs: parseInt(manualFood.carbs) || 0,
      fats: parseInt(manualFood.fats) || 0,
      fiber: parseInt(manualFood.fiber) || 0,
      sugar: parseInt(manualFood.sugar) || 0,
      sodium: parseInt(manualFood.sodium) || 0,
      serving_size: manualFood.serving_size || null,
    };

    onAddFood(foodData, selectedMealType, true);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setManualFood({
      food_name: "",
      food_category: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
      fiber: "",
      sugar: "",
      sodium: "",
      serving_size: "",
    });
    setSearchQuery("");
    setActiveTab("analyzed");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Food to Tracker</DialogTitle>
          <DialogDescription>
            Select from analyzed foods or add manually
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Meal Type Selection */}
          <div className="space-y-2">
            <Label>Add to Meal</Label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for Analyzed vs Manual */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyzed">Analyzed Foods</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="analyzed" className="flex-1 space-y-4 overflow-hidden flex flex-col">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search foods..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(v: "all" | "favorites") => setFilterType(v)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Foods</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFoods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No foods found</p>
                    <p className="text-sm">
                      Try analyzing foods in the Analyzer page first
                    </p>
                  </div>
                ) : (
                  filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{food.food_name}</p>
                          {food.is_favorite && (
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {food.protein}g protein • {food.carbs}g carbs •{" "}
                          {food.fats}g fats
                        </p>
                        {food.food_category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {food.food_category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant="secondary">{food.calories} cal</Badge>
                          {food.serving_size && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {food.serving_size}
                            </p>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleAddAnalyzedFood(food)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 overflow-y-auto">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="food_name">Food Name *</Label>
                  <Input
                    id="food_name"
                    placeholder="e.g., Grilled Chicken Breast"
                    value={manualFood.food_name}
                    onChange={(e) => setManualFood({ ...manualFood, food_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="food_category">Category</Label>
                    <Input
                      id="food_category"
                      placeholder="e.g., Protein"
                      value={manualFood.food_category}
                      onChange={(e) => setManualFood({ ...manualFood, food_category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serving_size">Serving Size</Label>
                    <Input
                      id="serving_size"
                      placeholder="e.g., 100g"
                      value={manualFood.serving_size}
                      onChange={(e) => setManualFood({ ...manualFood, serving_size: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories *</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="0"
                      value={manualFood.calories}
                      onChange={(e) => setManualFood({ ...manualFood, calories: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="0"
                      value={manualFood.protein}
                      onChange={(e) => setManualFood({ ...manualFood, protein: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="0"
                      value={manualFood.carbs}
                      onChange={(e) => setManualFood({ ...manualFood, carbs: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fats">Fats (g)</Label>
                    <Input
                      id="fats"
                      type="number"
                      placeholder="0"
                      value={manualFood.fats}
                      onChange={(e) => setManualFood({ ...manualFood, fats: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fiber">Fiber (g)</Label>
                    <Input
                      id="fiber"
                      type="number"
                      placeholder="0"
                      value={manualFood.fiber}
                      onChange={(e) => setManualFood({ ...manualFood, fiber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sugar">Sugar (g)</Label>
                    <Input
                      id="sugar"
                      type="number"
                      placeholder="0"
                      value={manualFood.sugar}
                      onChange={(e) => setManualFood({ ...manualFood, sugar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sodium">Sodium (mg)</Label>
                    <Input
                      id="sodium"
                      type="number"
                      placeholder="0"
                      value={manualFood.sodium}
                      onChange={(e) => setManualFood({ ...manualFood, sodium: e.target.value })}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddManualFood}
                  disabled={!manualFood.food_name || !manualFood.calories}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function TrackerPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchFoodLogs();
  }, [selectedDate]);

  const fetchFoodLogs = async () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const totalFats = entries.reduce((sum, entry) => sum + entry.fats, 0);

  const calorieGoal = 2000;
  const proteinGoal = 150;
  const carbsGoal = 250;
  const fatsGoal = 65;

  const getEntriesByMealType = (mealType: string) =>
    entries.filter((e) => e.mealType === mealType);

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const handleAddFoodToMeal = async (food: AnalyzedFood | any, mealType: string, isManual: boolean) => {
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
          mealType: data.meal_type as "breakfast" | "lunch" | "dinner" | "snack",
          analyzedFoodId: data.analyzed_food_id,
        };
        setEntries([...entries, newEntry]);
      }
    } catch (error) {
      console.error("Error adding food to meal:", error);
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
              <h1 className="text-xl font-semibold">Diet Tracker</h1>
              <p className="text-sm text-muted-foreground">
                Log and track your daily meals
              </p>
            </div>
            <Button onClick={() => setIsAddFoodOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Food
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Date Navigation */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changeDate(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changeDate(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
              <CardDescription>Your nutrition progress today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Calories
                    </span>
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
                    <span className="text-sm text-muted-foreground">
                      Protein
                    </span>
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
                    <span className="text-sm text-accent">
                      {totalCarbs} / {carbsGoal}g
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width: `${Math.min(
                          (totalCarbs / carbsGoal) * 100,
                          100
                        )}%`,
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
                        width: `${Math.min(
                          (totalFats / fatsGoal) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal Sections */}
          <div className="space-y-4">
            <MealSection
              mealType="breakfast"
              title="Breakfast"
              mealEntries={getEntriesByMealType("breakfast")}
              onDeleteEntry={handleDeleteEntry}
            />
            <MealSection
              mealType="lunch"
              title="Lunch"
              mealEntries={getEntriesByMealType("lunch")}
              onDeleteEntry={handleDeleteEntry}
            />
            <MealSection
              mealType="dinner"
              title="Dinner"
              mealEntries={getEntriesByMealType("dinner")}
              onDeleteEntry={handleDeleteEntry}
            />
            <MealSection
              mealType="snack"
              title="Snacks"
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
