"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { zhCN, enUS } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ArrowRight
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

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
}

interface MealPlan {
  date: string;
  summary: string;
  total_nutrition: Nutrition;
  meals: Meal[];
}

export default function MealPlannerPage() {
  // Initial State Setup
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const { t, language } = useLanguage();
  const dateLocale = language === 'zh' ? zhCN : enUS;

  const supabase = createClient();

  // Load profile and local meal plans on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProfile(true);
        // Load Profile
        const { data: { user } } = await supabase.auth.getUser();
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

      const response = await fetch("http://127.0.0.1:5000/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          profile: profile,
          language: profile.language || 'en'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setMealPlans(prev => ({
        ...prev,
        [dateStr]: data.plan
      }));

      toast.success("Meal plan generated successfully!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = mealPlans[format(selectedDate, "yyyy-MM-dd")];

  const getDayButton = (date: Date) => {
    const isSelected = isSameDay(date, selectedDate);
    return (
      <button
        key={date.toISOString()}
        onClick={() => setSelectedDate(date)}
        className={`flex flex-col items-center justify-center min-w-[4.5rem] p-3 rounded-2xl transition-all border ${isSelected
          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
          : "bg-card hover:bg-accent/50 border-transparent"
          }`}
      >
        <span className="text-xs font-medium opacity-80">{format(date, "EEE", { locale: dateLocale })}</span>
        <span className="text-xl font-bold">{format(date, "d")}</span>
      </button>
    );
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i));

  // Pie chart data
  const macroData = currentPlan ? [
    { name: t.mealPlanner.protein, value: currentPlan.total_nutrition.protein, color: '#3b82f6' },
    { name: t.mealPlanner.carbs, value: currentPlan.total_nutrition.carbs, color: '#10b981' },
    { name: t.mealPlanner.fats, value: currentPlan.total_nutrition.fats, color: '#f59e0b' },
  ] : [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/5">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur px-6 transition-all">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t.mealPlanner.title}</h1>
              <p className="text-xs text-muted-foreground">{t.mealPlanner.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
                {format(selectedDate, "MMMM yyyy", { locale: dateLocale })}
              </span>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                {t.mealPlanner.today}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
          {/* Calendar Strip */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 md:justify-center">
            {weekDates.map(getDayButton)}
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
                <h2 className="text-2xl font-bold">{t.mealPlanner.noPlan} {format(selectedDate, "EEEE", { locale: dateLocale })}</h2>
                <p className="text-muted-foreground">
                  {t.mealPlanner.generatePlanInfo}
                </p>
              </div>

              {loadingProfile ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : !profile ? (
                <Button
                  size="lg"
                  onClick={() => router.push('/profile')}
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
              {/* Daily Summary */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t.mealPlanner.dailyOverview}
                    </CardTitle>
                    <CardDescription>{currentPlan.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-4 gap-4">
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{t.mealPlanner.calories}</span>
                      <div className="text-2xl font-bold text-primary mt-1">{currentPlan.total_nutrition.calories}</div>
                      <span className="text-xs text-muted-foreground">{t.mealPlanner.kcal}</span>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{t.mealPlanner.protein}</span>
                      <div className="text-2xl font-bold text-blue-500 mt-1">{currentPlan.total_nutrition.protein}g</div>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{t.mealPlanner.carbs}</span>
                      <div className="text-2xl font-bold text-emerald-500 mt-1">{currentPlan.total_nutrition.carbs}g</div>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{t.mealPlanner.fats}</span>
                      <div className="text-2xl font-bold text-amber-500 mt-1">{currentPlan.total_nutrition.fats}g</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t.mealPlanner.macroDistribution}</CardTitle>
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
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> {t.mealPlanner.protein}</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {t.mealPlanner.carbs}</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> {t.mealPlanner.fats}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Meals Grid */}
              <div className="grid md:grid-cols-2 gap-6 pb-12">
                {currentPlan.meals.map((meal, index) => (
                  <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow group flex flex-col">
                    <div className="h-2 bg-primary/20 w-full relative">
                      <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${(meal.nutrition.calories / 800) * 100}%` }} />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="secondary" className="mb-2">{meal.type}</Badge>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">{meal.name}</CardTitle>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{meal.nutrition.calories}</span>
                          <span className="text-xs text-muted-foreground block">{t.mealPlanner.kcal}</span>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">{meal.description}</CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 flex-1">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-muted-foreground" /> {t.mealPlanner.ingredients}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {meal.items.map((item, i) => (
                              <Badge key={i} variant="outline" className="bg-background font-normal">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg text-sm">
                          <strong className="text-muted-foreground mr-1">{t.mealPlanner.proTip}</strong>
                          {meal.tips}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                          <div className="p-2 bg-blue-500/10 rounded text-blue-700 dark:text-blue-400">
                            <div className="font-bold">{meal.nutrition.protein}g</div> {t.mealPlanner.protein}
                          </div>
                          <div className="p-2 bg-emerald-500/10 rounded text-emerald-700 dark:text-emerald-400">
                            <div className="font-bold">{meal.nutrition.carbs}g</div> {t.mealPlanner.carbs}
                          </div>
                          <div className="p-2 bg-amber-500/10 rounded text-amber-700 dark:text-amber-400">
                            <div className="font-bold">{meal.nutrition.fats}g</div> {t.mealPlanner.fats}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pb-8">
                <Button variant="outline" onClick={generatePlan} disabled={loading} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {t.mealPlanner.regeneratePlan}
                </Button>
              </div>

            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
