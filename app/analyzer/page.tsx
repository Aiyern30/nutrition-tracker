"use client";
import Image from "next/image";
import { useState, useRef } from "react";
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
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [activeTab, setActiveTab] = useState("image");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (activeTab === "image") {
      handleAnalyzeImage();
    } else {
      handleAnalyzeDescription();
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
              <h1 className="text-xl font-semibold">Food Analyzer</h1>
              <p className="text-sm text-muted-foreground">
                Analyze foods with AI using images or descriptions
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
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image">
                      <FileImage className="mr-2 h-4 w-4" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="description">Description</TabsTrigger>
                  </TabsList>

                  <TabsContent value="image" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Food Image</Label>

                      {!selectedImage ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
                        >
                          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            Click to upload image
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <Image
                            className="absolute right-2 top-2 h-6 w-6 text-white"
                            width={192}
                            height={192}
                            src={selectedImage}
                            alt="selected food"
                          />

                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute right-2 top-2"
                            onClick={handleRemoveImage}
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
                      <Label>Additional Description (Optional)</Label>
                      <Textarea
                        placeholder="e.g., serving size, preparation method..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {ocrResults.length > 0 && (
                      <div className="space-y-2">
                        <Label>Detected Text (OCR)</Label>
                        <div className="max-h-32 overflow-y-auto rounded-lg border bg-muted p-3">
                          {ocrResults.map((ocr, idx) => (
                            <div
                              key={idx}
                              className="mb-2 flex items-start justify-between text-xs"
                            >
                              <span className="flex-1">{ocr.text}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {(ocr.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

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
                </Tabs>

                {error && (
                  <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={
                    isAnalyzing ||
                    (activeTab === "image" && !selectedImage) ||
                    (activeTab === "description" && !description.trim())
                  }
                  className="mt-6 w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {activeTab === "image"
                        ? "Processing Image..."
                        : "Analyzing..."}
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
                <Card className="flex h-100 items-center justify-center">
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
                          Upload a food image or enter a description to get
                          instant nutrition information
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
                          {result.serving_size && (
                            <p className="text-sm text-muted-foreground">
                              Serving: {result.serving_size}
                            </p>
                          )}
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
                            <p className="text-2xl font-bold text-orange-500">
                              {result.carbs}g
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                              Fats
                            </p>
                            <p className="text-2xl font-bold text-yellow-500">
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

                  {/* Explanation */}
                  {result.explanation && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Analysis</CardTitle>
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
                    <Button variant="outline">
                      <Heart className="mr-2 h-4 w-4" />
                      Save to Favorites
                    </Button>
                    <Button variant="outline">
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
