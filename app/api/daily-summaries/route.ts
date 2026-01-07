import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const filter = searchParams.get("filter"); // 'week', 'month', or 'all'
    const metrics = searchParams.get("metrics");
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!user_id) {
      return NextResponse.json({ data: [], error: "User ID required" }, { status: 400 });
    }

    // Build select query based on metrics filter
    let selectFields = "*";

    if (metrics && metrics !== "all") {
      const metricsList = metrics.split(",");
      selectFields = "id,user_id,date,created_at,updated_at,diet_quality_score,diet_quality_explanation";
      
      if (metricsList.includes("calories")) selectFields += ",total_calories";
      if (metricsList.includes("protein")) selectFields += ",total_protein";
      if (metricsList.includes("carbs")) selectFields += ",total_carbs";
      if (metricsList.includes("fats")) selectFields += ",total_fats";
      if (metricsList.includes("water")) selectFields += ",water_intake";
      if (metricsList.includes("steps")) selectFields += ",steps";
      if (metricsList.includes("sleep")) selectFields += ",sleep_hours";
      if (metricsList.includes("weight")) selectFields += ",weight";
    }

    let query = supabase
      .from("daily_summaries")
      .select(selectFields)
      .eq("user_id", user_id)
      .order("date", { ascending: false });

    // Apply date filter
    if (filter && filter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today);

      switch (filter) {
        case "week":
          // Start of current week (Sunday)
          startDate.setDate(today.getDate() - today.getDay());
          break;
        case "month":
          // Start of current month
          startDate.setDate(1);
          break;
      }

      const fromDateStr = startDate.toISOString().split("T")[0];
      query = query.gte("date", fromDateStr);
      
      console.log(`[/api/daily-summaries] Filtering from date: ${fromDateStr} (filter: ${filter})`);
    }

    const { data, error } = await query;

    console.log(
      `[/api/daily-summaries] user_id: ${user_id}, filter: ${filter}, metrics: ${metrics}, returned rows: ${data?.length ?? 0}`
    );

    if (error) {
      console.error("[/api/daily-summaries] Supabase error:", error);
      return NextResponse.json(
        { data: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data: Array.isArray(data) ? data : [],
      filter: filter || "all",
      count: data?.length || 0
    });
  } catch (error) {
    console.error("[/api/daily-summaries] Error:", error);
    return NextResponse.json(
      {
        data: [],
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
