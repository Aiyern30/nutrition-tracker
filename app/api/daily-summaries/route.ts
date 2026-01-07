import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const filter = searchParams.get("filter"); // 'week', 'month', or 'all'
    const search = searchParams.get("search"); // Search term
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const metrics = searchParams.get("metrics");

    // Use server-side Supabase client to handle sessions/RLS
    const supabase = await createClient();

    if (!user_id) {
      return NextResponse.json(
        { data: [], error: "User ID required", total: 0 },
        { status: 400 }
      );
    }

    // Build select query based on metrics filter
    let selectFields = "*";

    if (metrics && metrics !== "all") {
      const metricsList = metrics.split(",");
      selectFields =
        "id,user_id,date,created_at,updated_at,diet_quality_score,diet_quality_explanation";

      if (metricsList.includes("calories")) selectFields += ",total_calories";
      if (metricsList.includes("protein")) selectFields += ",total_protein";
      if (metricsList.includes("carbs")) selectFields += ",total_carbs";
      if (metricsList.includes("fats")) selectFields += ",total_fats";
      if (metricsList.includes("water")) selectFields += ",water_intake";
      if (metricsList.includes("steps")) selectFields += ",steps";
      if (metricsList.includes("sleep")) selectFields += ",sleep_hours";
      if (metricsList.includes("weight")) selectFields += ",weight";
    }

    // Base query for counting
    let countQuery = supabase
      .from("daily_summaries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id);

    // Base query for data
    let dataQuery = supabase
      .from("daily_summaries")
      .select(selectFields)
      .eq("user_id", user_id)
      .order("date", { ascending: false });

    // Apply date filter to both queries
    if (filter && filter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(today);

      switch (filter) {
        case "week":
          // Start of current week (Sunday) - ensure we're using local timezone
          const dayOfWeek = today.getDay();
          startDate.setDate(today.getDate() - dayOfWeek);
          break;
        case "month":
          // Start of current month
          startDate.setDate(1);
          break;
      }

      // Format date as YYYY-MM-DD in local timezone
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const fromDateStr = `${year}-${month}-${day}`;

      countQuery = countQuery.gte("date", fromDateStr);
      dataQuery = dataQuery.gte("date", fromDateStr);

      console.log(
        `[/api/daily-summaries] Date filter: ${filter}, from: ${fromDateStr}, today: ${
          today.toISOString().split("T")[0]
        }`
      );
    }

    // Apply search filter to both queries if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();

      // For date search, we use cast to text to allow ilike search
      // Note: Supabase/PostgREST syntax for OR filters with ilike
      const searchFilter = `diet_quality_score.ilike.%${searchTerm}%,diet_quality_explanation.ilike.%${searchTerm}%`;

      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);

      console.log(`[/api/daily-summaries] Search term: "${searchTerm}"`);
    }

    // Get total count
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("[/api/daily-summaries] Count error:", countError);
      throw countError;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Apply pagination to data query
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Execute data query
    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      console.error("[/api/daily-summaries] Data error:", dataError);
      throw dataError;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(
      `[/api/daily-summaries] RESPONSE DETAILS:
       - user_id: ${user_id}
       - filter: ${filter}
       - search: "${search || ""}"
       - page: ${page}/${totalPages}
       - limit: ${limit}
       - offset: ${offset}
       - count from DB: ${count}
       - data rows returned: ${data?.length || 0}`
    );

    return NextResponse.json({
      data: Array.isArray(data) ? data : [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
      filter: filter || "all",
    });
  } catch (error) {
    console.error("[/api/daily-summaries] Error:", error);
    return NextResponse.json(
      {
        data: [],
        error: error instanceof Error ? error.message : "Internal Server Error",
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      },
      { status: 500 }
    );
  }
}
