"use client";

import { useState } from "react";
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

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

const sampleEntries: FoodEntry[] = [
  {
    id: "1",
    name: "Scrambled Eggs",
    calories: 220,
    protein: 18,
    carbs: 4,
    fats: 15,
    mealType: "breakfast",
  },
  {
    id: "2",
    name: "Whole Wheat Toast",
    calories: 140,
    protein: 6,
    carbs: 26,
    fats: 2,
    mealType: "breakfast",
  },
  {
    id: "3",
    name: "Chicken Caesar Salad",
    calories: 480,
    protein: 42,
    carbs: 18,
    fats: 26,
    mealType: "lunch",
  },
  {
    id: "4",
    name: "Protein Shake",
    calories: 200,
    protein: 30,
    carbs: 15,
    fats: 3,
    mealType: "snack",
  },
];

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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="bg-transparent">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Food to {title}</DialogTitle>
                <DialogDescription>
                  Enter the food details or search recent items
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Food Name</Label>
                  <Input placeholder="e.g., Grilled Chicken" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Calories</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Protein (g)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <Button className="w-full">Add to Tracker</Button>
              </div>
            </DialogContent>
          </Dialog>
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

export default function TrackerPage() {
  const [entries, setEntries] = useState<FoodEntry[]>(sampleEntries);
  const [selectedDate] = useState(new Date());

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

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
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
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Date Navigation */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon">
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
                <Button variant="ghost" size="icon">
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
      </SidebarInset>
    </SidebarProvider>
  );
}
