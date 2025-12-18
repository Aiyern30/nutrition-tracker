"use client";
import Image from "next/image";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  CheckCircle,
  Heart,
  Plus,
  MessageSquare,
  Upload,
  X,
  FileImage,
  Loader2,
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
  serving_size?: string;
  confidence: "high" | "medium" | "low";
  benefits: string[];
  considerations: string[];
  explanation?: string;
}

interface OCRResult {
  text: string;
  confidence: number;
}

export default function AnalyzerPage() {
  const { t } = useLanguage();
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [activeTab, setActiveTab] = useState("image");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAddedToTracker, setIsAddedToTracker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setOcrResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setError("Please upload an image first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setOcrResults([]);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage,
          description: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze image");
      }

      const data = await response.json();

      if (data.success) {
        setOcrResults(data.ocr_results || []);
        setResult(data.nutrition);
      } else {
        throw new Error("Analysis failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze food");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeDescription = async () => {
    if (!description.trim()) {
      setError("Please enter a food description");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze description");
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.nutrition);
      } else {
        throw new Error("Analysis failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze food");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    // Reset tracker state when analyzing new food
    setIsAddedToTracker(false);
    setSaveSuccess(false);

    if (activeTab === "image") {
      handleAnalyzeImage();
    } else {
      handleAnalyzeDescription();
    }
  };

  const handleAddToTracker = async () => {
    if (!result) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to save foods");
        return;
      }

      const { error: insertError } = await supabase
        .from("analyzed_foods")
        .insert({
          user_id: user.id,
          food_name: result.name,
          food_description: description || null,
          food_category: result.category,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          fiber: result.fiber,
          sugar: result.sugar,
          sodium: result.sodium,
          serving_size: result.serving_size || null,
          confidence_level: result.confidence,
          ai_explanation: result.explanation || null,
          health_benefits: result.benefits.join(" • "),
          considerations: result.considerations.join(" • "),
          is_favorite: false,
        });

      if (insertError) throw insertError;

      setIsAddedToTracker(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save to tracker"
      );
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{t.analyzer.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t.analyzer.subtitle}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Input Panel */}
            <Card className="lg:col-span-1 flex flex-col h-full">
              <CardHeader>
                <CardTitle>{t.analyzer.inputMethod.title}</CardTitle>
                <CardDescription>
                  {t.analyzer.inputMethod.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full flex-1 flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image">
                      <FileImage className="mr-2 h-4 w-4" />
                      {t.analyzer.inputMethod.imageTab}
                    </TabsTrigger>
                    <TabsTrigger value="description">
                      {t.analyzer.inputMethod.descriptionTab}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="image"
                    className="space-y-4 flex-1 flex flex-col"
                  >
                    <div className="space-y-2">
                      <Label>{t.analyzer.imageUpload.title}</Label>

                      {!selectedImage ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
                        >
                          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {t.analyzer.imageUpload.clickToUpload}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t.analyzer.imageUpload.fileTypes}
                          </p>
                        </div>
                      ) : (
                        <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                          <Image
                            src={selectedImage}
                            alt="selected food"
                            fill
                            className="object-cover"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 z-10"
                            onClick={handleRemoveImage}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.analyzer.imageUpload.additionalDesc}</Label>
                      <Textarea
                        placeholder={
                          t.analyzer.imageUpload.additionalDescPlaceholder
                        }
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {ocrResults.length > 0 && (
                      <div className="space-y-2 flex-1 flex flex-col">
                        <Label>{t.analyzer.imageUpload.detectedText}</Label>
                        <Textarea
                          value={ocrResults.map((ocr) => ocr.text).join("\n")}
                          readOnly
                          className="resize-none min-h-45 max-h-80 flex-1 bg-muted border rounded-lg p-3 text-sm leading-relaxed"
                        />
                      </div>
                    )}

                    <div className="mt-4 shrink-0">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !selectedImage}
                        className="w-full h-12"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.analyzer.buttons.processingImage}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t.analyzer.buttons.analyzeFood}
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="description" className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t.analyzer.descriptionInput.title}</Label>
                      <Textarea
                        placeholder={t.analyzer.descriptionInput.placeholder}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t.analyzer.descriptionInput.hint}
                      </p>
                    </div>

                    {error && (
                      <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !description.trim()}
                      className="w-full h-12"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.analyzer.buttons.analyzing}
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {t.analyzer.buttons.analyzeFood}
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6 lg:col-span-2">
              {isAnalyzing ? (
                <Card className="flex min-h-100 items-center justify-center">
                  <CardContent className="text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-primary/20"></div>
                        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary"></div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          {t.analyzer.results.analyzingTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === "image"
                            ? t.analyzer.results.analyzingImageDesc
                            : t.analyzer.results.analyzingTextDesc}
                        </p>
                        <div className="flex items-center justify-center gap-1 pt-2">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : !result ? (
                <Card className="flex min-h-100 items-center justify-center">
                  <CardContent className="text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          {t.analyzer.results.readyTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {t.analyzer.results.readyDesc}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 text-left">
                        <div className="flex items-start gap-2">
                          <FileImage className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">
                              {t.analyzer.results.imageAnalysis}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.analyzer.results.imageAnalysisDesc}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">
                              {t.analyzer.results.textDescription}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.analyzer.results.textDescriptionDesc}
                            </p>
                          </div>
                        </div>
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
                              {t.analyzer.confidenceLevels[result.confidence]}{" "}
                              {t.analyzer.results.confidence}
                            </Badge>
                          </div>
                          {result.serving_size && (
                            <p className="text-sm text-muted-foreground">
                              {t.analyzer.results.serving}:{" "}
                              {result.serving_size}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold text-primary">
                            {result.calories}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t.analyzer.results.calories}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Nutrition Facts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.analyzer.results.nutritionFacts}</CardTitle>
                      <CardDescription>
                        {t.analyzer.results.nutritionFactsDesc}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              {t.analyzer.results.protein}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              {result.protein}g
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              {t.analyzer.results.carbs}
                            </p>
                            <p className="text-2xl font-bold text-orange-500">
                              {result.carbs}g
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              {t.analyzer.results.fats}
                            </p>
                            <p className="text-2xl font-bold text-yellow-500">
                              {result.fats}g
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">
                              {t.analyzer.results.fiber}
                            </span>
                            <span className="font-medium">{result.fiber}g</span>
                          </div>
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">
                              {t.analyzer.results.sugar}
                            </span>
                            <span className="font-medium">{result.sugar}g</span>
                          </div>
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">
                              {t.analyzer.results.sodium}
                            </span>
                            <span className="font-medium">
                              {result.sodium}mg
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Explanation */}
                  {result.explanation && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t.analyzer.results.analysis}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {result.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Health Benefits */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-primary" />
                          {t.analyzer.results.healthBenefits}
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
                        <CardTitle>
                          {t.analyzer.results.considerations}
                        </CardTitle>
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

                  {saveSuccess && (
                    <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-sm text-primary flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t.analyzer.results.successMessage}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {!isAddedToTracker ? (
                      <Button
                        variant="default"
                        onClick={handleAddToTracker}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.analyzer.buttons.saving}
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            {t.analyzer.buttons.addToTracker}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="default" disabled>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t.analyzer.buttons.addedToTracker}
                      </Button>
                    )}
                    <Button variant="outline">
                      <Heart className="mr-2 h-4 w-4" />
                      {t.analyzer.buttons.saveToFavorites}
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t.analyzer.buttons.askAI}
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
