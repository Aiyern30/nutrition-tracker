/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

interface AddFoodDialogProps {
  onAddFood: (
    food: AnalyzedFood | any,
    mealType: string,
    isManual: boolean
  ) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ITEMS_PER_PAGE = 4; // Changed from 10 to 4 to show pagination with 5 items
const SEARCH_DEBOUNCE_MS = 300; // Reduced from 500ms for faster response

export function AddFoodDialog({
  onAddFood,
  isOpen,
  onOpenChange,
}: AddFoodDialogProps) {
  const { t } = useLanguage();
  const [analyzedFoods, setAnalyzedFoods] = useState<AnalyzedFood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "favorites">("all");
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [activeTab, setActiveTab] = useState<"analyzed" | "manual">("analyzed");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAnalyzedFoods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view analyzed foods");
        setIsLoading(false);
        return;
      }

      // Calculate pagination - simpler calculation
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      console.log(`Fetching page ${currentPage}: from=${from}, to=${to}`);

      // Build query with server-side filtering
      let query = supabase
        .from("analyzed_foods")
        .select(
          "id, food_name, food_category, calories, protein, carbs, fats, fiber, sugar, sodium, serving_size, is_favorite, created_at",
          { count: "exact" }
        )
        .eq("user_id", user.id);

      // Apply favorite filter
      if (filterType === "favorites") {
        query = query.eq("is_favorite", true);
      }

      // Apply search filter - use simpler OR condition
      if (debouncedSearch.trim()) {
        const searchTerm = `%${debouncedSearch.trim()}%`;
        query = query.or(
          `food_name.ilike.${searchTerm},food_category.ilike.${searchTerm}`
        );
      }

      // Apply pagination and ordering
      const {
        data,
        error: fetchError,
        count,
      } = await query.order("created_at", { ascending: false }).range(from, to);

      if (fetchError) {
        console.error("Supabase error:", fetchError);
        throw fetchError;
      }

      console.log(`Fetched ${data?.length || 0} foods, total count: ${count}`);

      setAnalyzedFoods(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching analyzed foods:", error);
      setError("Failed to load foods. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, currentPage, debouncedSearch, filterType]);

  useEffect(() => {
    if (isOpen) {
      fetchAnalyzedFoods();
    }
  }, [isOpen, fetchAnalyzedFoods]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const showPagination = totalPages > 1;

  const handleAddAnalyzedFood = (food: AnalyzedFood) => {
    onAddFood(food, selectedMealType, false);
    onOpenChange(false);
    resetForm();
  };

  const handleAddManualFood = () => {
    if (!manualFood.food_name || !manualFood.calories) return;

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
    setDebouncedSearch("");
    setCurrentPage(1);
    setActiveTab("analyzed");
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.tracker.addFoodDialog.title}</DialogTitle>
          <DialogDescription>
            {t.tracker.addFoodDialog.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="space-y-2 shrink-0">
            <Label>{t.tracker.addFoodDialog.addToMeal}</Label>
            <Select
              value={selectedMealType}
              onValueChange={setSelectedMealType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">
                  {t.tracker.meals.breakfast}
                </SelectItem>
                <SelectItem value="lunch">{t.tracker.meals.lunch}</SelectItem>
                <SelectItem value="dinner">{t.tracker.meals.dinner}</SelectItem>
                <SelectItem value="snack">{t.tracker.meals.snacks}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="analyzed">
                {t.tracker.addFoodDialog.analyzedFoods}
              </TabsTrigger>
              <TabsTrigger value="manual">
                {t.tracker.addFoodDialog.manualEntry}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="analyzed"
              className="flex-1 flex flex-col space-y-3 min-h-0 mt-3"
            >
              <div className="flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t.tracker.addFoodDialog.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(v: "all" | "favorites") => {
                    setFilterType(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t.tracker.addFoodDialog.allFoods}
                    </SelectItem>
                    <SelectItem value="favorites">
                      {t.tracker.addFoodDialog.favorites}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              {!isLoading && totalCount > 0 && (
                <div className="text-xs text-muted-foreground shrink-0">
                  {t.tracker.addFoodDialog.showing}{" "}
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}
                  -{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}{" "}
                  {t.tracker.addFoodDialog.of} {totalCount}{" "}
                  {totalCount === 1
                    ? t.tracker.addFoodDialog.food
                    : t.tracker.addFoodDialog.foods}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive shrink-0">
                  {error}
                </div>
              )}

              {/* Scrollable food list */}
              <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                <div className="space-y-2 pb-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : analyzedFoods.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="font-medium">
                        {t.tracker.addFoodDialog.noFoodsFound}
                      </p>
                      <p className="text-sm mt-1">
                        {totalCount === 0
                          ? t.tracker.addFoodDialog.noFoodsHint
                          : t.tracker.addFoodDialog.noMatch}
                      </p>
                    </div>
                  ) : (
                    analyzedFoods.map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {food.food_name}
                            </p>
                            {food.is_favorite && (
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
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
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <Badge variant="secondary">
                              {food.calories} {t.tracker.meals.calories}
                            </Badge>
                            {food.serving_size && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {food.serving_size}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddAnalyzedFood(food)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {t.tracker.addFoodDialog.add}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pagination - Show if more than 1 page */}
              {showPagination && !isLoading && (
                <div className="flex items-center justify-between pt-2 border-t shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t.tracker.addFoodDialog.previous}
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {t.tracker.addFoodDialog.page} {currentPage}{" "}
                    {t.tracker.addFoodDialog.of} {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                  >
                    {t.tracker.addFoodDialog.next}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="flex-1 overflow-y-auto mt-3">
              <div className="grid gap-4 pb-4">
                <div className="grid gap-2">
                  <Label htmlFor="food_name">
                    {t.tracker.addFoodDialog.foodName}{" "}
                    {t.tracker.addFoodDialog.required}
                  </Label>
                  <Input
                    id="food_name"
                    placeholder={t.tracker.addFoodDialog.foodNamePlaceholder}
                    value={manualFood.food_name}
                    onChange={(e) =>
                      setManualFood({
                        ...manualFood,
                        food_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="food_category">
                      {t.tracker.addFoodDialog.category}
                    </Label>
                    <Input
                      id="food_category"
                      placeholder={t.tracker.addFoodDialog.categoryPlaceholder}
                      value={manualFood.food_category}
                      onChange={(e) =>
                        setManualFood({
                          ...manualFood,
                          food_category: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serving_size">
                      {t.tracker.addFoodDialog.servingSize}
                    </Label>
                    <Input
                      id="serving_size"
                      placeholder={
                        t.tracker.addFoodDialog.servingSizePlaceholder
                      }
                      value={manualFood.serving_size}
                      onChange={(e) =>
                        setManualFood({
                          ...manualFood,
                          serving_size: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="calories">
                      {t.tracker.addFoodDialog.calories}{" "}
                      {t.tracker.addFoodDialog.required}
                    </Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="0"
                      value={manualFood.calories}
                      onChange={(e) =>
                        setManualFood({
                          ...manualFood,
                          calories: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">
                      {t.tracker.addFoodDialog.protein}
                    </Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="0"
                      value={manualFood.protein}
                      onChange={(e) =>
                        setManualFood({
                          ...manualFood,
                          protein: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="carbs">
                      {t.tracker.addFoodDialog.carbs}
                    </Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="0"
                      value={manualFood.carbs}
                      onChange={(e) =>
                        setManualFood({ ...manualFood, carbs: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fats">{t.tracker.addFoodDialog.fats}</Label>
                    <Input
                      id="fats"
                      type="number"
                      placeholder="0"
                      value={manualFood.fats}
                      onChange={(e) =>
                        setManualFood({ ...manualFood, fats: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fiber">
                      {t.tracker.addFoodDialog.fiber}
                    </Label>
                    <Input
                      id="fiber"
                      type="number"
                      placeholder="0"
                      value={manualFood.fiber}
                      onChange={(e) =>
                        setManualFood({ ...manualFood, fiber: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sugar">
                      {t.tracker.addFoodDialog.sugar}
                    </Label>
                    <Input
                      id="sugar"
                      type="number"
                      placeholder="0"
                      value={manualFood.sugar}
                      onChange={(e) =>
                        setManualFood({ ...manualFood, sugar: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sodium">
                      {t.tracker.addFoodDialog.sodium}
                    </Label>
                    <Input
                      id="sodium"
                      type="number"
                      placeholder="0"
                      value={manualFood.sodium}
                      onChange={(e) =>
                        setManualFood({ ...manualFood, sodium: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddManualFood}
                  disabled={!manualFood.food_name || !manualFood.calories}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.tracker.addFoodDialog.addToMealButton}{" "}
                  {selectedMealType === "breakfast" &&
                    t.tracker.meals.breakfast}
                  {selectedMealType === "lunch" && t.tracker.meals.lunch}
                  {selectedMealType === "dinner" && t.tracker.meals.dinner}
                  {selectedMealType === "snack" && t.tracker.meals.snacks}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
