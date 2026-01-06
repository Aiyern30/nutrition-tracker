"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Calendar as CalendarIcon,
  ChefHat,
  Utensils,
  Flame,
  Droplets,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Types matched to Backend response
interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  type: string;
  name: string;
  description: string;
  items: string[];
  nutrition: Nutrition;
  tips: string;
  image_url?: string;
}

interface MealPlan {
  date: string;
  summary: string;
  total_nutrition: Nutrition;
  meals: Meal[];
  image_url?: string;
}

export default function MealPlannerPage() {
  // Initial State Setup
  useLocalizedMetadata({ page: "mealPlanner" });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [pendingPlan, setPendingPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const { t, language } = useLanguage();
  const dateLocale = language === "zh" ? zhCN : enUS;

  const supabase = createClient();

  // Load profile and local meal plans on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProfile(true);
        // Load Profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (data) setProfile(data);
        }

        // Load cached meal plans from local storage
        const savedPlans = localStorage.getItem("mealPlans");
        if (savedPlans) {
          setMealPlans(JSON.parse(savedPlans));
        }

        // Load plans from Supabase
        if (user) {
          const { data: dbMeals } = await supabase
            .from("meal_plans")
            .select("*")
            .eq("user_id", user.id);

          if (dbMeals) {
            const plansMap: Record<string, MealPlan> = {};

            // Group by date
            const groupedMeals: Record<string, any[]> = {};
            dbMeals.forEach((meal: any) => {
              if (!groupedMeals[meal.date]) {
                groupedMeals[meal.date] = [];
              }
              groupedMeals[meal.date].push(meal);
            });

            // Reconstruct MealPlans
            Object.entries(groupedMeals).forEach(([date, meals]) => {
              // Calculate totals from meals
              const totalNutrition = meals.reduce(
                (acc, meal) => ({
                  calories: acc.calories + (meal.calories || 0),
                  protein: acc.protein + (meal.protein || 0),
                  carbs: acc.carbs + (meal.carbs || 0),
                  fats: acc.fats + (meal.fats || 0),
                }),
                { calories: 0, protein: 0, carbs: 0, fats: 0 }
              );

              plansMap[date] = {
                date: date,
                summary: meals[0]?.daily_summary || "",
                image_url: meals[0]?.image_url || undefined,
                total_nutrition: totalNutrition,
                meals: meals.map((m) => ({
                  type: m.meal_type,
                  name: m.name,
                  description: m.description,
                  items: m.items || [],
                  nutrition: {
                    calories: m.calories || 0,
                    protein: m.protein || 0,
                    carbs: m.carbs || 0,
                    fats: m.fats || 0,
                  },
                  tips: m.tips || "",
                })),
              };
            });

            setMealPlans((prev) => ({ ...prev, ...plansMap }));
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadData();
  }, [supabase]);

  // Save meal plans to local storage whenever they change
  useEffect(() => {
    if (Object.keys(mealPlans).length > 0) {
      localStorage.setItem("mealPlans", JSON.stringify(mealPlans));
    }
  }, [mealPlans]);

  const generatePlan = async () => {
    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const response = await fetch("/api/meal_planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          profile: profile,
          language: profile.language || "en",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setPendingPlan(data.plan);

      toast.success("Meal plan generated! Please review and save.");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!pendingPlan || !profile) {
      console.log("Missing pending plan or profile");
      return;
    }
    setLoading(true);

    try {
      console.log("Starting save process...");

      // Use profile.id directly to avoid network hang on getUser()
      const userId = profile.id;

      if (!userId) {
        // Fallback or error if profile is somehow malformed
        console.error("Profile missing ID");
        throw new Error("User profile corrupted");
      }

      console.log("User ID:", userId);
      console.log("Plan date:", pendingPlan.date);

      // 1. Delete existing meals for this date
      console.log("Deleting existing meals...");
      const { error: deleteError } = await supabase
        .from("meal_plans")
        .delete()
        .eq("user_id", userId)
        .eq("date", pendingPlan.date);

      if (deleteError) {
        console.error("Delete Error:", deleteError);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      // 2. Insert new meals
      console.log("Preparing meals for insert...");
      const mealsToInsert = pendingPlan.meals.map((meal: Meal) => ({
        user_id: userId,
        date: pendingPlan.date,
        daily_summary: pendingPlan.summary,
        image_url: meal.image_url,
        meal_type: meal.type,
        name: meal.name,
        description: meal.description,
        items: meal.items || [],
        calories: meal.nutrition.calories || 0,
        protein: meal.nutrition.protein || 0,
        carbs: meal.nutrition.carbs || 0,
        fats: meal.nutrition.fats || 0,
        tips: meal.tips || "",
      }));

      console.log("Inserting meals count:", mealsToInsert.length);
      const { error: insertError } = await supabase
        .from("meal_plans")
        .insert(mealsToInsert);

      if (insertError) {
        console.error("Insert Error:", insertError);
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      console.log("Save successful!");

      // Update local state by forcing a re-fetch or manual update
      setMealPlans((prev) => ({
        ...prev,
        [pendingPlan.date]: pendingPlan,
      }));
      setPendingPlan(null);
      toast.success("Meal plan saved successfully!");
    } catch (e: any) {
      console.error("Save Plan Exception:", e);
      toast.error(e.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [currentMobileCenter, setCurrentMobileCenter] = useState<Date>(
    new Date()
  );
  const [currentTabletCenter, setCurrentTabletCenter] = useState<Date>(
    new Date()
  );

  const isPending =
    pendingPlan && isSameDay(new Date(pendingPlan.date), selectedDate);
  const currentPlan = isPending
    ? pendingPlan
    : mealPlans[format(selectedDate, "yyyy-MM-dd")];

  const getDayButton = (date: Date) => {
    const isSelected = isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());
    const hasPlan = mealPlans[format(date, "yyyy-MM-dd")];

    return (
      <button
        key={date.toISOString()}
        onClick={() => setSelectedDate(date)}
        className={`relative flex flex-col items-center justify-center min-w-[60px] sm:min-w-[68px] lg:min-w-[76px] p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl transition-all border-2 snap-center shrink-0 ${
          isSelected
            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
            : isToday
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-card hover:bg-accent/50 border-transparent hover:border-border"
        }`}
      >
        <span
          className={`text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 ${
            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
        >
          {format(date, "EEE", { locale: dateLocale })}
        </span>
        <span className="text-lg sm:text-xl font-bold">
          {format(date, "d")}
        </span>
        {hasPlan && !isSelected && (
          <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </button>
    );
  };

  // Generate week dates based on current week start
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Generate 5-day view for tablet (2 days before center, center, 2 days after)
  const tabletDates = Array.from({ length: 5 }, (_, i) =>
    addDays(currentTabletCenter, i - 2)
  );

  // Generate 3-day view for mobile (1 day before center, center, 1 day after)
  const mobileDates = Array.from({ length: 3 }, (_, i) =>
    addDays(currentMobileCenter, i - 1)
  );

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToPreviousTablet = () => {
    setCurrentTabletCenter(addDays(currentTabletCenter, -5));
  };

  const goToNextTablet = () => {
    setCurrentTabletCenter(addDays(currentTabletCenter, 5));
  };

  const goToPreviousMobile = () => {
    setCurrentMobileCenter(addDays(currentMobileCenter, -3));
  };

  const goToNextMobile = () => {
    setCurrentMobileCenter(addDays(currentMobileCenter, 3));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setCurrentTabletCenter(today);
    setCurrentMobileCenter(today);
    setSelectedDate(today);
  };

  // Pie chart data
  const macroData = currentPlan
    ? [
        {
          name: t.mealPlanner.protein,
          value: currentPlan.total_nutrition.protein,
          color: "#3b82f6",
        },
        {
          name: t.mealPlanner.carbs,
          value: currentPlan.total_nutrition.carbs,
          color: "#10b981",
        },
        {
          name: t.mealPlanner.fats,
          value: currentPlan.total_nutrition.fats,
          color: "#f59e0b",
        },
      ]
    : [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/5">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur px-6 transition-all">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {t.mealPlanner.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t.mealPlanner.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline-block">
                      {selectedDate
                        ? format(selectedDate, "PPP", { locale: dateLocale })
                        : t.mealPlanner.pickDate}
                    </span>
                    <span className="md:hidden">
                      {selectedDate
                        ? format(selectedDate, "MM/dd", { locale: dateLocale })
                        : t.mealPlanner.pickDate}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={dateLocale}
                    modifiers={{
                      hasPlan: (date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        return dateStr in mealPlans;
                      },
                    }}
                    modifiersClassNames={{
                      hasPlan:
                        "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full after:opacity-70 data-[selected=true]:after:bg-primary-foreground",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
          {/* Calendar Navigation */}
          <div className="space-y-3">
            {/* Desktop: Full week with navigation (lg and above) */}
            <div className="hidden lg:flex items-center gap-2 lg:gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousWeek}
                className="shrink-0 h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2 lg:gap-3 flex-1 justify-center overflow-hidden">
                {weekDates.map(getDayButton)}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextWeek}
                className="shrink-0 h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Tablet: 5-day view (md to lg) */}
            <div className="hidden md:block lg:hidden">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  {format(selectedDate, "MMMM yyyy", { locale: dateLocale })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="h-7 text-xs px-3"
                >
                  {t.mealPlanner.today || "Today"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousTablet}
                  className="shrink-0 h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-2 sm:gap-3 flex-1 justify-center overflow-hidden">
                  {tabletDates.map(getDayButton)}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextTablet}
                  className="shrink-0 h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile: 3-day view (below md) */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  {format(selectedDate, "MMMM yyyy", { locale: dateLocale })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="h-7 text-xs px-3"
                >
                  {t.mealPlanner.today || "Today"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMobile}
                  className="shrink-0 h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-2 sm:gap-3 flex-1 justify-center overflow-hidden">
                  {mobileDates.map(getDayButton)}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMobile}
                  className="shrink-0 h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {!currentPlan ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative bg-background p-6 rounded-full border shadow-xl">
                  <ChefHat className="w-12 h-12 text-primary" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold">
                  {t.mealPlanner.noPlan}{" "}
                  {format(selectedDate, "EEEE", { locale: dateLocale })}
                </h2>
                <p className="text-muted-foreground">
                  {t.mealPlanner.generatePlanInfo}
                </p>
              </div>

              {loadingProfile ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : !profile ? (
                <Button
                  size="lg"
                  onClick={() => router.push("/profile")}
                  className="rounded-full px-8 h-12 text-base shadow-lg"
                >
                  {t.mealPlanner.setupProfile}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={generatePlan}
                  disabled={loading}
                  className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-primary/25 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t.mealPlanner.creatingPlan}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {t.mealPlanner.generatePlan}
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {isPending && (
                <Alert className="bg-primary/10 border-primary/20 shadow-sm animate-pulse">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-bold">
                    New Plan Generated
                  </AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-2">
                    <span>
                      This plan is not saved yet. Would you like to keep it?
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generatePlan}
                        disabled={loading}
                        className="flex-1 sm:flex-none"
                      >
                        <RefreshCw
                          className={`w-3 h-3 mr-2 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        onClick={savePlan}
                        disabled={loading}
                        className="flex-1 sm:flex-none"
                      >
                        Confirm & Save
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Daily Summary */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-md bg-linear-to-br from-primary/5 to-transparent relative overflow-hidden">
                  {currentPlan.image_url && (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={currentPlan.image_url}
                        alt="Meal Plan"
                        className="w-full h-full object-cover opacity-20"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/40" />
                    </div>
                  )}

                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t.mealPlanner.dailyOverview}
                    </CardTitle>
                    <CardDescription>{currentPlan.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-4 gap-4 relative z-10">
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        {t.mealPlanner.calories}
                      </span>
                      <div className="text-2xl font-bold text-primary mt-1">
                        {currentPlan.total_nutrition.calories}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t.mealPlanner.kcal}
                      </span>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        {t.mealPlanner.protein}
                      </span>
                      <div className="text-2xl font-bold text-blue-500 mt-1">
                        {currentPlan.total_nutrition.protein}g
                      </div>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        {t.mealPlanner.carbs}
                      </span>
                      <div className="text-2xl font-bold text-emerald-500 mt-1">
                        {currentPlan.total_nutrition.carbs}g
                      </div>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        {t.mealPlanner.fats}
                      </span>
                      <div className="text-2xl font-bold text-amber-500 mt-1">
                        {currentPlan.total_nutrition.fats}g
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {t.mealPlanner.macroDistribution}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />{" "}
                        {t.mealPlanner.protein}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                        {t.mealPlanner.carbs}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                        {t.mealPlanner.fats}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Meals Grid */}
              <div className="grid md:grid-cols-2 gap-6 pb-12">
                {currentPlan.meals.map((meal, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow group flex flex-col"
                  >
                    {meal.image_url ? (
                      <div className="relative w-full h-64 bg-muted">
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          className="w-full h-full object-cover object-center"
                        />
                        {/* Gradient overlay for better readability */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                        {/* Calorie progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20 backdrop-blur-sm">
                          <div
                            className="h-full bg-primary shadow-lg"
                            style={{
                              width: `${Math.min(
                                100,
                                (meal.nutrition.calories / 800) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-2 bg-primary/20 w-full relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-primary"
                          style={{
                            width: `${(meal.nutrition.calories / 800) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {meal.type}
                          </Badge>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {meal.name}
                          </CardTitle>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">
                            {meal.nutrition.calories}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            {t.mealPlanner.kcal}
                          </span>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {meal.description}
                      </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 flex-1">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-muted-foreground" />{" "}
                            {t.mealPlanner.ingredients}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {meal.items.map((item, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-background font-normal"
                              >
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg text-sm">
                          <strong className="text-muted-foreground mr-1">
                            {t.mealPlanner.proTip}
                          </strong>
                          {meal.tips}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                          <div className="p-2 bg-blue-500/10 rounded text-blue-700 dark:text-blue-400">
                            <div className="font-bold">
                              {meal.nutrition.protein}g
                            </div>{" "}
                            {t.mealPlanner.protein}
                          </div>
                          <div className="p-2 bg-emerald-500/10 rounded text-emerald-700 dark:text-emerald-400">
                            <div className="font-bold">
                              {meal.nutrition.carbs}g
                            </div>{" "}
                            {t.mealPlanner.carbs}
                          </div>
                          <div className="p-2 bg-amber-500/10 rounded text-amber-700 dark:text-amber-400">
                            <div className="font-bold">
                              {meal.nutrition.fats}g
                            </div>{" "}
                            {t.mealPlanner.fats}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pb-8">
                {!isPending && (
                  <Button
                    variant="outline"
                    onClick={generatePlan}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                    {t.mealPlanner.regeneratePlan}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
