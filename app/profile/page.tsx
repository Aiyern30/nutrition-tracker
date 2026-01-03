"use client";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import { useUser } from "@/contexts/user-context";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";

// Import new components
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalGoals } from "@/components/profile/personal-goals";
import { DietaryPreferences } from "@/components/profile/dietary-preferences";
import { NotificationsSettings } from "@/components/profile/notifications-settings";
import { AppSettings } from "@/components/profile/app-settings";
import { LegalSupport } from "@/components/profile/legal-support";
import {
  ProfileHeaderSkeleton,
  PersonalGoalsSkeleton,
  DietaryPreferencesSkeleton,
  SettingsSkeleton,
} from "@/components/profile/profile-skeleton";

interface Profile {
  id: string;
  display_name: string | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
  daily_water_goal: number;
  activity_level: string;
  goal_type: string;
  dietary_restrictions: string[];
  disliked_foods: string[];
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  meal_reminders: boolean;
  weekly_summary: boolean;
  ai_insights: boolean;
  theme: string;
  language: string;
  units: string;
  created_at: string;
}

export default function ProfilePage() {
  useLocalizedMetadata({ page: "profile" });

  const { setTheme } = useTheme();
  const { t, setLanguage: setAppLanguage } = useLanguage();
  const { user, initializing: userLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    target_weight: null as number | null,
    meal_reminders: true,
    weekly_summary: true,
    ai_insights: true,
    theme: "system",
    language: "en",
    units: "metric",
  });

  const supabase = createClient();

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
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
          target_weight: data.target_weight,
          meal_reminders: data.meal_reminders ?? true,
          weekly_summary: data.weekly_summary ?? true,
          ai_insights: data.ai_insights ?? true,
          theme: data.theme || "system",
          language: data.language || "en",
          units: data.units || "metric",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!userLoading) {
      if (user) {
        fetchProfile();
      } else {
        // User not logged in, stop loading
        setLoading(false);
      }
    }
  }, [userLoading, user, fetchProfile]);

  const handleUpdateGoals = async (updates?: Partial<typeof formData>) => {
    try {
      setSaving(true);
      setError(null);

      if (!profile?.id) return;

      const dataToUpdate = { ...formData, ...updates };

      const { error } = await supabase
        .from("profiles")
        .update({
          daily_calorie_goal: dataToUpdate.daily_calorie_goal,
          daily_protein_goal: dataToUpdate.daily_protein_goal,
          daily_carbs_goal: dataToUpdate.daily_carbs_goal,
          daily_fats_goal: dataToUpdate.daily_fats_goal,
          daily_water_goal: dataToUpdate.daily_water_goal,
          activity_level: dataToUpdate.activity_level,
          goal_type: dataToUpdate.goal_type,
          height: dataToUpdate.height,
          weight: dataToUpdate.weight,
          target_weight: dataToUpdate.target_weight,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      await fetchProfile();
      setSuccess(t.profile.messages.goalsUpdated);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.profile.messages.updateError
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!profile?.id) return;

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
        .eq("id", profile.id);

      if (error) throw error;

      setTheme(formData.theme);
      setAppLanguage(formData.language as "en" | "zh");

      await fetchProfile();
      setSuccess(t.profile.messages.settingsUpdated);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.profile.messages.saveSettingsError
      );
    } finally {
      setSaving(false);
    }
  };

  const addDietaryRestriction = async (restriction: string) => {
    try {
      if (!profile?.id) return;

      const updated = [...formData.dietary_restrictions, restriction];

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setFormData({ ...formData, dietary_restrictions: updated });
      await fetchProfile();
      setSuccess(t.profile.messages.restrictionAdded);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.profile.messages.addRestrictionError
      );
    }
  };

  const removeDietaryRestriction = async (item: string) => {
    try {
      if (!profile?.id) return;

      const updated = formData.dietary_restrictions.filter((r) => r !== item);

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setFormData({ ...formData, dietary_restrictions: updated });
      await fetchProfile();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove restriction"
      );
    }
  };

  const addDislikedFood = async (food: string) => {
    try {
      if (!profile?.id) return;

      const updated = [...formData.disliked_foods, food];

      const { error } = await supabase
        .from("profiles")
        .update({
          disliked_foods: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setFormData({ ...formData, disliked_foods: updated });
      await fetchProfile();
      setSuccess(t.profile.messages.foodAdded);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.profile.messages.addFoodError
      );
    }
  };

  const removeDislikedFood = async (item: string) => {
    try {
      if (!profile?.id) return;

      const updated = formData.disliked_foods.filter((f) => f !== item);

      const { error } = await supabase
        .from("profiles")
        .update({
          disliked_foods: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setFormData({ ...formData, disliked_foods: updated });
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove food");
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
              <h1 className="text-xl font-semibold">{t.profile.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t.profile.subtitle}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {!user && !userLoading ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t.profile.messages.notLoggedIn}
              </AlertDescription>
            </Alert>
          ) : (
            <>
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

              {loading ? (
                <ProfileHeaderSkeleton />
              ) : (
                <ProfileHeader
                  displayName={user?.name || "User"}
                  userEmail={user?.email || ""}
                  userAvatarUrl={user?.avatar_url || null}
                  createdAt={user?.created_at || new Date().toISOString()}
                  language={formData.language}
                />
              )}

              {loading ? (
                <PersonalGoalsSkeleton />
              ) : (
                <PersonalGoals
                  formData={{
                    daily_calorie_goal: formData.daily_calorie_goal,
                    daily_protein_goal: formData.daily_protein_goal,
                    daily_carbs_goal: formData.daily_carbs_goal,
                    daily_fats_goal: formData.daily_fats_goal,
                    activity_level: formData.activity_level,
                    goal_type: formData.goal_type,
                    height: formData.height,
                    weight: formData.weight,
                    target_weight: formData.target_weight,
                    units: formData.units,
                  }}
                  onFormDataChange={(updates) =>
                    setFormData({ ...formData, ...updates })
                  }
                  onSave={handleUpdateGoals}
                  saving={saving}
                />
              )}

              {loading ? (
                <DietaryPreferencesSkeleton />
              ) : (
                <DietaryPreferences
                  dietaryRestrictions={formData.dietary_restrictions}
                  dislikedFoods={formData.disliked_foods}
                  onAddRestriction={addDietaryRestriction}
                  onRemoveRestriction={removeDietaryRestriction}
                  onAddDislikedFood={addDislikedFood}
                  onRemoveDislikedFood={removeDislikedFood}
                />
              )}

              {loading ? (
                <SettingsSkeleton />
              ) : (
                <NotificationsSettings
                  mealReminders={formData.meal_reminders}
                  weeklySummary={formData.weekly_summary}
                  aiInsights={formData.ai_insights}
                  onMealRemindersChange={(value) =>
                    setFormData({ ...formData, meal_reminders: value })
                  }
                  onWeeklySummaryChange={(value) =>
                    setFormData({ ...formData, weekly_summary: value })
                  }
                  onAiInsightsChange={(value) =>
                    setFormData({ ...formData, ai_insights: value })
                  }
                  onSave={handleUpdateSettings}
                  saving={saving}
                />
              )}

              {loading ? (
                <SettingsSkeleton />
              ) : (
                <AppSettings
                  theme={formData.theme}
                  language={formData.language}
                  units={formData.units}
                  onThemeChange={(value) =>
                    setFormData({ ...formData, theme: value })
                  }
                  onLanguageChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                  onUnitsChange={(value) =>
                    setFormData({ ...formData, units: value })
                  }
                  onSave={handleUpdateSettings}
                  saving={saving}
                />
              )}

              <LegalSupport />
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
