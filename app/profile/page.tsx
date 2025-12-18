"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Target,
  Bell,
  Globe,
  Moon,
  Shield,
  HelpCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
  daily_water_goal: number;
  current_streak: number;
  activity_level: string;
  goal_type: string;
  dietary_restrictions: string[];
  disliked_foods: string[];
  height: number | null;
  weight: number | null;
  meal_reminders: boolean;
  weekly_summary: boolean;
  ai_insights: boolean;
  theme: string;
  language: string;
  units: string;
  created_at: string;
}

export default function ProfilePage() {
  const { setTheme } = useTheme();
  const { language, setLanguage: setAppLanguage } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 200,
    daily_fats_goal: 65,
    daily_water_goal: 8,
    activity_level: "moderate",
    goal_type: "maintenance",
    dietary_restrictions: [] as string[],
    disliked_foods: [] as string[],
    height: null as number | null,
    weight: null as number | null,
    meal_reminders: true,
    weekly_summary: true,
    ai_insights: true,
    theme: "system",
    language: "en",
    units: "metric",
  });

  const [newRestriction, setNewRestriction] = useState("");
  const [newDislikedFood, setNewDislikedFood] = useState("");

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email || "");
      setUserAvatarUrl(user.user_metadata?.avatar_url || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || "",
          daily_calorie_goal: data.daily_calorie_goal,
          daily_protein_goal: data.daily_protein_goal,
          daily_carbs_goal: data.daily_carbs_goal,
          daily_fats_goal: data.daily_fats_goal,
          daily_water_goal: data.daily_water_goal,
          activity_level: data.activity_level,
          goal_type: data.goal_type,
          dietary_restrictions: data.dietary_restrictions || [],
          disliked_foods: data.disliked_foods || [],
          height: data.height,
          weight: data.weight,
          meal_reminders: data.meal_reminders ?? true,
          weekly_summary: data.weekly_summary ?? true,
          ai_insights: data.ai_insights ?? true,
          theme: data.theme || "system",
          language: data.language || "en",
          units: data.units || "metric",
        });

        // Apply theme from profile
        if (data.theme) {
          setTheme(data.theme);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [supabase, setTheme]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateGoals = async () => {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name,
          daily_calorie_goal: formData.daily_calorie_goal,
          daily_protein_goal: formData.daily_protein_goal,
          daily_carbs_goal: formData.daily_carbs_goal,
          daily_fats_goal: formData.daily_fats_goal,
          daily_water_goal: formData.daily_water_goal,
          activity_level: formData.activity_level,
          goal_type: formData.goal_type,
          height: formData.height,
          weight: formData.weight,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccess("Goals updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goals");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          meal_reminders: formData.meal_reminders,
          weekly_summary: formData.weekly_summary,
          ai_insights: formData.ai_insights,
          theme: formData.theme,
          language: formData.language,
          units: formData.units,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update UI theme and language immediately
      setTheme(formData.theme);
      setAppLanguage(formData.language as "en" | "zh");

      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const addDietaryRestriction = async () => {
    if (!newRestriction.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const updated = [...formData.dietary_restrictions, newRestriction.trim()];

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setFormData({ ...formData, dietary_restrictions: updated });
      setNewRestriction("");
      setSuccess("Dietary restriction added!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add restriction"
      );
    }
  };

  const removeDietaryRestriction = async (item: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const updated = formData.dietary_restrictions.filter((r) => r !== item);

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setFormData({ ...formData, dietary_restrictions: updated });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove restriction"
      );
    }
  };

  const addDislikedFood = async () => {
    if (!newDislikedFood.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const updated = [...formData.disliked_foods, newDislikedFood.trim()];

      const { error } = await supabase
        .from("profiles")
        .update({
          disliked_foods: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setFormData({ ...formData, disliked_foods: updated });
      setNewDislikedFood("");
      setSuccess("Disliked food added!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add food");
    }
  };

  const removeDislikedFood = async (item: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const updated = formData.disliked_foods.filter((f) => f !== item);

      const { error } = await supabase
        .from("profiles")
        .update({
          disliked_foods: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setFormData({ ...formData, disliked_foods: updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove food");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Profile & Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                  {userAvatarUrl ? (
                    <Image
                      alt=""
                      width={96}
                      height={96}
                      src={userAvatarUrl}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    // Fallback to icon
                    <User className="h-12 w-12" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-bold">
                    Welcome, {formData.display_name || "User"}
                  </h2>
                  {userEmail && (
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  )}
                  {/* <div className="flex items-center gap-2">
                    <Badge>Free Plan</Badge>
                    <Badge variant="secondary">
                      {profile?.current_streak || 0} day streak
                    </Badge>
                  </div> */}
                  <p className="text-sm text-muted-foreground">
                    Member since{" "}
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "Recently"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Personal Goals</CardTitle>
              </div>
              <CardDescription>
                Set your nutrition and health objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </div>

              {/* Height and Weight */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="height">
                    Height ({formData.units === "metric" ? "cm" : "in"})
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder={formData.units === "metric" ? "170" : "67"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">
                    Weight ({formData.units === "metric" ? "kg" : "lbs"})
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder={formData.units === "metric" ? "70.0" : "154.3"}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calorie-goal">Daily Calorie Goal</Label>
                  <Input
                    id="calorie-goal"
                    type="number"
                    value={formData.daily_calorie_goal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daily_calorie_goal: parseInt(e.target.value) || 2000,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein-goal">Daily Protein Goal (g)</Label>
                  <Input
                    id="protein-goal"
                    type="number"
                    value={formData.daily_protein_goal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daily_protein_goal: parseInt(e.target.value) || 150,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs-goal">Daily Carbs Goal (g)</Label>
                  <Input
                    id="carbs-goal"
                    type="number"
                    value={formData.daily_carbs_goal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daily_carbs_goal: parseInt(e.target.value) || 200,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats-goal">Daily Fats Goal (g)</Label>
                  <Input
                    id="fats-goal"
                    type="number"
                    value={formData.daily_fats_goal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daily_fats_goal: parseInt(e.target.value) || 65,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-level">Activity Level</Label>
                  <Select
                    value={formData.activity_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, activity_level: value })
                    }
                  >
                    <SelectTrigger id="activity-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Lightly Active</SelectItem>
                      <SelectItem value="moderate">
                        Moderately Active
                      </SelectItem>
                      <SelectItem value="active">Very Active</SelectItem>
                      <SelectItem value="very_active">Extra Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-type">Primary Goal</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, goal_type: value })
                    }
                  >
                    <SelectTrigger id="goal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="maintenance">
                        Maintain Weight
                      </SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="health">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleUpdateGoals} disabled={saving}>
                {saving ? "Updating..." : "Update Goals"}
              </Button>
            </CardContent>
          </Card>

          {/* Dietary Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
              <CardDescription>
                Customize your meal recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Allergies & Restrictions</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRestriction}
                    onChange={(e) => setNewRestriction(e.target.value)}
                    placeholder="Add dietary restriction"
                    onKeyDown={(e) =>
                      e.key === "Enter" && addDietaryRestriction()
                    }
                  />
                  <Button onClick={addDietaryRestriction} type="button">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.dietary_restrictions.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeDietaryRestriction(item)}
                    >
                      {item} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Foods to Avoid</Label>
                <div className="flex gap-2">
                  <Input
                    value={newDislikedFood}
                    onChange={(e) => setNewDislikedFood(e.target.value)}
                    placeholder="Add disliked food"
                    onKeyDown={(e) => e.key === "Enter" && addDislikedFood()}
                  />
                  <Button onClick={addDislikedFood} type="button">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.disliked_foods.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeDislikedFood(item)}
                    >
                      {item} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Meal Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to log your meals
                  </p>
                </div>
                <Switch
                  checked={formData.meal_reminders}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, meal_reminders: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly nutrition report
                  </p>
                </div>
                <Switch
                  checked={formData.weekly_summary}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, weekly_summary: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Get personalized suggestions from AI
                  </p>
                </div>
                <Switch
                  checked={formData.ai_insights}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ai_insights: checked })
                  }
                />
              </div>
              <Separator />
              <Button
                onClick={handleUpdateSettings}
                disabled={saving}
                className="w-full mt-4"
              >
                {saving ? "Updating..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label>Theme</Label>
                </div>
                <Select
                  value={formData.theme}
                  onValueChange={(value) =>
                    setFormData({ ...formData, theme: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Label>Language</Label>
                </div>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Units</Label>
                <Select
                  value={formData.units}
                  onValueChange={(value) =>
                    setFormData({ ...formData, units: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <Button
                onClick={handleUpdateSettings}
                disabled={saving}
                className="w-full mt-4"
              >
                {saving ? "Updating..." : "Save App Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* Legal & Support */}
          <Card>
            <CardHeader>
              <CardTitle>About & Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-accent/50 bg-accent/5">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  <strong>Important Disclaimer:</strong> This app provides
                  nutritional information and dietary guidance for educational
                  purposes only. It is not a substitute for professional medical
                  advice, diagnosis, or treatment. Always consult with a
                  qualified healthcare provider before making any dietary
                  changes, especially if you have medical conditions or
                  concerns.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Terms of Service
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
