"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";

interface AnalyzedFood {
  id: string;
  food_name: string;
  food_category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size: string | null;
  confidence_level: string;
  is_favorite: boolean;
  created_at: string;
}

const ITEMS_PER_PAGE = 4;

export function AnalyzedFoodsHistory() {
  const [foods, setFoods] = useState<AnalyzedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Calculate offset for pagination
      // Page 1: from=0, to=3 (OFFSET 0 LIMIT 4)
      // Page 2: from=4, to=7 (OFFSET 4 LIMIT 4)
      // Page 3: from=8, to=11 (OFFSET 8 LIMIT 4)
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Fetch with pagination using .range()
      // This translates to SQL: OFFSET {from} LIMIT {ITEMS_PER_PAGE}
      const { data, error: fetchError, count } = await supabase
        .from("analyzed_foods")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      setFoods(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching foods:", err);
      setError("Failed to load analyzed foods");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, currentPage]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from("analyzed_foods")
        .update({ is_favorite: !currentStatus })
        .eq("id", id);

      if (updateError) throw updateError;

      // Update local state
      setFoods(
        foods.map((food) =>
          food.id === id ? { ...food, is_favorite: !currentStatus } : food
        )
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Handler functions for pagination
  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading && foods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Your food analysis history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Your food analysis history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Your food analysis history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No analyzed foods yet</p>
            <p className="text-sm mt-1">
              Start analyzing foods to see them here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{" "}
              {totalCount} foods
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{food.food_name}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {food.food_category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{food.protein}g protein</span>
                  <span>{food.carbs}g carbs</span>
                  <span>{food.fats}g fats</span>
                </div>
                {food.serving_size && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Serving: {food.serving_size}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(food.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <Badge variant="secondary" className="text-sm">
                    {food.calories} cal
                  </Badge>
                  <Badge
                    variant={
                      food.confidence_level === "high"
                        ? "default"
                        : food.confidence_level === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs mt-1"
                  >
                    {food.confidence_level}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    handleToggleFavorite(food.id, food.is_favorite)
                  }
                >
                  <Heart
                    className={`h-4 w-4 ${
                      food.is_favorite
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls - This is the key part! */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={!hasPrevPage || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!hasNextPage || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
