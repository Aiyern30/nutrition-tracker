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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  CheckCircle,
  Heart,
  Plus,
  MessageSquare,
} from "lucide-react";

interface NutritionResult {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  confidence: "high" | "medium" | "low";
  benefits: string[];
  considerations: string[];
}

export default function AnalyzerPage() {
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setResult({
        name: "Grilled Chicken Breast with Steamed Broccoli",
        category: "Protein & Vegetables",
        calories: 285,
        protein: 48,
        carbs: 12,
        fats: 6,
        fiber: 4,
        sugar: 2,
        sodium: 320,
        confidence: "high",
        benefits: [
          "High protein content supports muscle growth and repair",
          "Rich in vitamins C and K from broccoli",
          "Low in calories, ideal for weight management",
          "Contains essential amino acids",
        ],
        considerations: [
          "May be high in sodium depending on seasoning",
          "Contains common allergen: poultry",
          "Best consumed fresh for maximum nutrients",
        ],
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Food Analyzer</h1>
              <p className="text-sm text-muted-foreground">
                Analyze foods and predict nutritional values with AI
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Input Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Input Method</CardTitle>
                <CardDescription>
                  Choose how to analyze your food
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Describe your food</Label>
                      <Textarea
                        placeholder="e.g., grilled chicken breast with steamed broccoli"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Be as detailed as possible for accurate results
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="ingredients" className="space-y-4">
                    <div className="space-y-3">
                      <Label>Add ingredients</Label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Ingredient"
                            className="col-span-2"
                          />
                          <Input placeholder="Amount" />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Ingredient
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleAnalyze}
                  disabled={!description.trim() || isAnalyzing}
                  className="mt-6 w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Food
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6 lg:col-span-2">
              {!result ? (
                <Card className="flex h-150 items-center justify-center">
                  <CardContent className="text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          Ready to Analyze
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Enter a food description to get instant nutrition
                          information
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Header Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl">
                            {result.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{result.category}</Badge>
                            <Badge
                              variant={
                                result.confidence === "high"
                                  ? "default"
                                  : result.confidence === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {result.confidence} confidence
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold text-primary">
                            {result.calories}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            calories
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Nutrition Facts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Nutrition Facts</CardTitle>
                      <CardDescription>
                        Detailed nutritional breakdown per serving
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              Protein
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              {result.protein}g
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              Carbs
                            </p>
                            <p className="text-2xl font-bold text-accent">
                              {result.carbs}g
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              Fats
                            </p>
                            <p className="text-2xl font-bold text-chart-3">
                              {result.fats}g
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Fiber</span>
                            <span className="font-medium">{result.fiber}g</span>
                          </div>
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Sugar</span>
                            <span className="font-medium">{result.sugar}g</span>
                          </div>
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">
                              Sodium
                            </span>
                            <span className="font-medium">
                              {result.sodium}mg
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Benefits */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-primary" />
                          Health Benefits
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.benefits.map((benefit, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Considerations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.considerations.map((consideration, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground" />
                              <span>{consideration}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Tracker
                    </Button>
                    <Button variant="outline" className="bg-transparent">
                      <Heart className="mr-2 h-4 w-4" />
                      Save to Favorites
                    </Button>
                    <Button variant="outline" className="bg-transparent">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ask AI About This
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
