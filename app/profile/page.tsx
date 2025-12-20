"use client";
import { useState } from "react";
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

export default function ProfilePage() {
  useLocalizedMetadata({ page: "profile" });

  const { setTheme } = useTheme();
  const { t, setLanguage: setAppLanguage } = useLanguage();
  const { user, loading, refreshUser } = useUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: user?.profile?.display_name || "",
    daily_calorie_goal: user?.profile?.daily_calorie_goal || 2000,
    daily_protein_goal: user?.profile?.daily_protein_goal || 150,
    daily_carbs_goal: user?.profile?.daily_carbs_goal || 200,
    daily_fats_goal: user?.profile?.daily_fats_goal || 65,
    daily_water_goal: user?.profile?.daily_water_goal || 8,
    activity_level: user?.profile?.activity_level || "moderate",
    goal_type: user?.profile?.goal_type || "maintenance",
    dietary_restrictions: user?.profile?.dietary_restrictions || [],
    disliked_foods: user?.profile?.disliked_foods || [],
    height: user?.profile?.height || null,
    weight: user?.profile?.weight || null,
    meal_reminders: user?.profile?.meal_reminders ?? true,
    weekly_summary: user?.profile?.weekly_summary ?? true,
    ai_insights: user?.profile?.ai_insights ?? true,
    theme: user?.profile?.theme || "system",
    language: user?.profile?.language || "en",
    units: user?.profile?.units || "metric",
  });

  const supabase = createClient();

  // Update formData when user profile loads
  useState(() => {
    if (user?.profile) {
      setFormData({
        display_name: user.profile.display_name || "",
        daily_calorie_goal: user.profile.daily_calorie_goal,
        daily_protein_goal: user.profile.daily_protein_goal,
        daily_carbs_goal: user.profile.daily_carbs_goal,
        daily_fats_goal: user.profile.daily_fats_goal,
        daily_water_goal: user.profile.daily_water_goal,
        activity_level: user.profile.activity_level,
        goal_type: user.profile.goal_type,
        dietary_restrictions: user.profile.dietary_restrictions || [],
        disliked_foods: user.profile.disliked_foods || [],
        height: user.profile.height,
        weight: user.profile.weight,
        meal_reminders: user.profile.meal_reminders ?? true,
        weekly_summary: user.profile.weekly_summary ?? true,
        ai_insights: user.profile.ai_insights ?? true,
        theme: user.profile.theme || "system",
        language: user.profile.language || "en",
        units: user.profile.units || "metric",
      });
    }
  });

  const handleUpdateGoals = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!user?.profile?.id) return;

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
        .eq("id", user.profile.id);

      if (error) throw error;

      await refreshUser();
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

      if (!user?.profile?.id) return;

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
        .eq("id", user.profile.id);

      if (error) throw error;

      setTheme(formData.theme);
      setAppLanguage(formData.language as "en" | "zh");

      await refreshUser();
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
      if (!user?.profile?.id) return;

      const updated = [...formData.dietary_restrictions, restriction];

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.profile.id);

      if (error) throw error;

      setFormData({ ...formData, dietary_restrictions: updated });
      await refreshUser();
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
      if (!user?.profile?.id) return;

      const updated = formData.dietary_restrictions.filter((r) => r !== item);

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.profile.id);

      if (error) throw error;

      setFormData({ ...formData, dietary_restrictions: updated });
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove restriction"
      );
    }
  };

  const addDislikedFood = async (food: string) => {
    try {
      if (!user?.profile?.id) return;

      const updated = [...formData.disliked_foods, food];

      const { error } = await supabase
        .from("profiles")
        .update({
          disliked_foods: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.profile.id);

      if (error) throw error;

      setFormData({ ...formData, disliked_foods: updated });
      await refreshUser();
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
      if (!user?.profile?.id) return;

      const updated = formData.disliked_foods.filter((f) => f !== item);

      const { error } = await supabase
        .from("profiles")
        .update({
          disliked_foods: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.profile.id);

      if (error) throw error;

      setFormData({ ...formData, disliked_foods: updated });
      await refreshUser();
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !user ? (
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

              <ProfileHeader
                displayName={formData.display_name}
                userEmail={user.email}
                userAvatarUrl={user.avatar_url || null}
                createdAt={user.profile?.created_at || new Date().toISOString()}
                language={formData.language}
              />

              <PersonalGoals
                formData={{
                  display_name: formData.display_name,
                  daily_calorie_goal: formData.daily_calorie_goal,
                  daily_protein_goal: formData.daily_protein_goal,
                  daily_carbs_goal: formData.daily_carbs_goal,
                  daily_fats_goal: formData.daily_fats_goal,
                  activity_level: formData.activity_level,
                  goal_type: formData.goal_type,
                  height: formData.height,
                  weight: formData.weight,
                  units: formData.units,
                }}
                onFormDataChange={(updates) =>
                  setFormData({ ...formData, ...updates })
                }
                onSave={handleUpdateGoals}
                saving={saving}
              />

              <DietaryPreferences
                dietaryRestrictions={formData.dietary_restrictions}
                dislikedFoods={formData.disliked_foods}
                onAddRestriction={addDietaryRestriction}
                onRemoveRestriction={removeDietaryRestriction}
                onAddDislikedFood={addDislikedFood}
                onRemoveDislikedFood={removeDislikedFood}
              />

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

              <LegalSupport />
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
