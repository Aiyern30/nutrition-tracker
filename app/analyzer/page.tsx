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
  Image as ImageIcon,
} from "lucide-react";
import { useEffect } from "react";
import { AnalyzedFoodsHistory } from "@/components/analyzer/analyzed-foods-history";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";

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
  useLocalizedMetadata({ page: "analyzer" });

  const { t, language } = useLanguage();
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  console.log("result:", result);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [activeTab, setActiveTab] = useState("image");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAddedToTracker, setIsAddedToTracker] = useState(false);
  const [savedFoodId, setSavedFoodId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Process and convert image to supported format (JPEG)
  const processImage = (file: File) => {
    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      setError("Please provide a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        // Create canvas to convert to JPEG
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Optional: Resize if too large (e.g., max 1600px)
        const MAX_SIZE = 1600;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to JPEG (supported by ERNIE base64)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          setSelectedImage(dataUrl);
          setError(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImage(file);
            setActiveTab("image"); // Switch to image tab if something is pasted
          }
        }
      }
    }
  };

  // Listen for paste events globally
  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage,
          description: description,
          lang: language,
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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description,
          lang: language,
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
    setSavedFoodId(null);
    setIsFavorite(false);

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
        setIsSaving(false);
        return;
      }

      // Use a timeout to detect slow operations
      const timeoutId = setTimeout(() => {
        console.warn("Insert operation is taking longer than expected...");
      }, 3000);

      const { data, error: insertError } = await supabase
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
        })
        .select("id, is_favorite")
        .single();

      clearTimeout(timeoutId);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      if (data) {
        setSavedFoodId(data.id);
        setIsFavorite(data.is_favorite);
      }

      setIsAddedToTracker(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save to tracker"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToFavorite = async () => {
    if (!savedFoodId) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("analyzed_foods")
        .update({ is_favorite: true })
        .eq("id", savedFoodId);

      if (updateError) throw updateError;

      setIsFavorite(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save to favorites"
      );
      console.error("Save favorite error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur px-6 transition-all">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {t.analyzer.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t.analyzer.subtitle}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Input Panel */}
            <Card className="lg:col-span-1 flex flex-col h-full rounded-[2rem] border-border/50 shadow-sm transition-all hover:shadow-md bg-white dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">📸</span>{" "}
                  {t.analyzer.inputMethod.title}
                </CardTitle>
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
                          <div className="flex flex-col items-center justify-center p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="text-muted-foreground">or</span>
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">
                              {t.analyzer.imageUpload.clickToUpload}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t.analyzer.imageUpload.fileTypes} •{" "}
                              {t.analyzer.imageUpload.ctrlVPaste}
                            </p>
                          </div>
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
                  <Card className="rounded-[2rem] border-border/50 shadow-sm bg-white dark:bg-card overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="relative z-10 p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="space-y-4 flex-1">
                          <div>
                            <CardTitle className="text-3xl font-bold text-foreground">
                              {result.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <Badge
                                variant="secondary"
                                className="rounded-full px-3 py-1 bg-muted/60 hover:bg-muted text-sm border-0 font-medium text-foreground/80"
                              >
                                🍽️ {result.category}
                              </Badge>
                              <Badge
                                className={`rounded-full px-3 py-1 border-0 text-sm font-medium ${
                                  result.confidence === "high"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : result.confidence === "medium"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                }`}
                              >
                                {result.confidence === "high"
                                  ? "✅"
                                  : result.confidence === "medium"
                                  ? "⚠️"
                                  : "❓"}{" "}
                                {t.analyzer.confidenceLevels[result.confidence]}{" "}
                                {t.analyzer.results.confidence}
                              </Badge>
                            </div>
                          </div>

                          {result.serving_size && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                              <span className="text-lg">⚖️</span>
                              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                {t.analyzer.results.serving}:{" "}
                                {result.serving_size}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="flex flex-col items-center justify-center w-[120px] h-[120px] rounded-[1.5rem] bg-linear-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-100 dark:border-orange-900/30 shadow-sm relative group hover:scale-105 transition-transform duration-300">
                            <span className="text-xs font-bold text-orange-900/60 dark:text-orange-100/60 uppercase tracking-widest absolute top-4">
                              {t.analyzer.results.calories}
                            </span>
                            <span className="text-4xl font-extrabold text-orange-600 dark:text-orange-400">
                              {result.calories}
                            </span>
                            <span className="text-[10px] bg-orange-200/50 dark:bg-orange-800/50 px-2 py-0.5 rounded-full text-orange-800 dark:text-orange-200 mt-1 font-medium">
                              kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Nutrition Facts */}
                  <Card className="rounded-[2rem] border-transparent shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-6">
                      {/* Macro Pills */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {/* Protein */}
                        <div className="col-span-1 h-[180px] rounded-[2rem] bg-blue-50/50 dark:bg-blue-900/5 border-2 border-blue-100 dark:border-blue-900/20 p-5 flex flex-col relative hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-card">
                          <div className="space-y-1">
                            <span className="text-blue-900/70 dark:text-blue-100/70 text-xs font-bold tracking-wide">
                              {t.analyzer.results.protein}
                            </span>
                            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                              {result.protein}
                              <span className="text-base align-baseline ml-0.5">
                                g
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-end gap-2">
                            <div className="h-1.5 w-10 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-lg shadow-sm">
                              🍗
                            </div>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="col-span-1 h-[180px] rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/5 border-2 border-emerald-100 dark:border-emerald-900/20 p-5 flex flex-col relative hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-card">
                          <div className="space-y-1">
                            <span className="text-emerald-900/70 dark:text-emerald-100/70 text-xs font-bold tracking-wide">
                              {t.analyzer.results.carbs}
                            </span>
                            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                              {result.carbs}
                              <span className="text-base align-baseline ml-0.5">
                                g
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-end gap-2">
                            <div className="h-1.5 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-1/2 rounded-full"></div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-lg shadow-sm">
                              🍞
                            </div>
                          </div>
                        </div>

                        {/* Fats */}
                        <div className="col-span-1 h-[180px] rounded-[2rem] bg-amber-50/50 dark:bg-amber-900/5 border-2 border-amber-100 dark:border-amber-900/20 p-5 flex flex-col relative hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-card">
                          <div className="space-y-1">
                            <span className="text-amber-900/70 dark:text-amber-100/70 text-xs font-bold tracking-wide">
                              {t.analyzer.results.fats}
                            </span>
                            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                              {result.fats}
                              <span className="text-base align-baseline ml-0.5">
                                g
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-end gap-2">
                            <div className="h-1.5 w-10 bg-amber-100 dark:bg-amber-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 w-1/3 rounded-full"></div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-lg shadow-sm">
                              🧀
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-card border border-border/50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">
                              🌾
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {t.analyzer.results.fiber}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-foreground">
                            {result.fiber}g
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-card border border-border/50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xl">
                              🍬
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {t.analyzer.results.sugar}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-foreground">
                            {result.sugar}g
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-card border border-border/50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                              🧂
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {t.analyzer.results.sodium}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-foreground">
                            {result.sodium}mg
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Explanation */}
                  {result.explanation && (
                    <Card className="rounded-[2rem] border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <span className="text-xl">💡</span>{" "}
                          {t.analyzer.results.analysis}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                          {result.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Health Benefits & Considerations */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-[2rem] border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                          <span className="text-xl">💪</span>
                          {t.analyzer.results.healthBenefits}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.benefits.map((benefit, i) => (
                            <li
                              key={i}
                              className="flex gap-2.5 text-sm items-start"
                            >
                              <span className="mt-0.5 shrink-0 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                                ✅
                              </span>
                              <span className="text-emerald-800/90 dark:text-emerald-200/90 leading-snug">
                                {benefit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                          <span className="text-xl">⚠️</span>
                          {t.analyzer.results.considerations}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.considerations.map((consideration, i) => (
                            <li
                              key={i}
                              className="flex gap-2.5 text-sm items-start"
                            >
                              <span className="mt-0.5 shrink-0 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                                🔸
                              </span>
                              <span className="text-amber-800/90 dark:text-amber-200/90 leading-snug">
                                {consideration}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {saveSuccess && (
                    <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-sm text-primary flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {isFavorite
                        ? "Successfully saved to favorites!"
                        : t.analyzer.results.successMessage}
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
                      <>
                        <Button variant="default" disabled>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t.analyzer.buttons.addedToTracker}
                        </Button>
                        {!isFavorite && (
                          <Button
                            variant="outline"
                            onClick={handleAddToFavorite}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.analyzer.buttons.saving}
                              </>
                            ) : (
                              <>
                                <Heart className="mr-2 h-4 w-4" />
                                {t.analyzer.buttons.saveToFavorites}
                              </>
                            )}
                          </Button>
                        )}
                        {isFavorite && (
                          <Button variant="outline" disabled>
                            <Heart className="mr-2 h-4 w-4 fill-current" />
                            Saved to Favorites
                          </Button>
                        )}
                      </>
                    )}
                    <Button variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t.analyzer.buttons.askAI}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Add History Section Below */}
          <AnalyzedFoodsHistory />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
