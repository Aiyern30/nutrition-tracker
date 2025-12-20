"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  diet_quality_score: string;
}

interface Profile {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
  daily_water_goal: number;
  current_streak: number;
}

interface DashboardContextType {
  dailySummary: DailySummary | null;
  profile: Profile | null;
  loading: boolean;
  refreshing: boolean; // New: separate state for background refresh
  refreshDashboard: () => Promise<void>;
  lastUpdated: Date | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    const supabase = createClient();

    try {
      // Only show loading spinner on initial load, not on refresh
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const [summaryResult, profileResult] = await Promise.all([
        supabase
          .from("daily_summaries")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single(),
        supabase
          .from("profiles")
          .select(
            "daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fats_goal, daily_water_goal, current_streak"
          )
          .eq("id", user.id)
          .single(),
      ]);

      setDailySummary(summaryResult.data);
      setProfile(profileResult.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchData(false);

    // Set up realtime subscription for updates
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_summaries",
        },
        () => {
          // Silently refresh in background
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchData]);

  return (
    <DashboardContext.Provider
      value={{
        dailySummary,
        profile,
        loading,
        refreshing,
        refreshDashboard,
        lastUpdated,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
