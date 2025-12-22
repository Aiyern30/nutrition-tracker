import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const days = searchParams.get("days");

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!user_id) {
      return NextResponse.json({ data: [] });
    }

    let query = supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", user_id)
      .order("date", { ascending: true });

    if (days && days !== "all") {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum) && daysNum > 0) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - daysNum + 1);
        const fromDateStr = fromDate.toISOString().split("T")[0];
        query = query.gte("date", fromDateStr);
      }
    }

    const { data, error } = await query;

    console.log(
      "[/api/daily-summaries] user_id:",
      user_id,
      "days:",
      days,
      "returned rows:",
      data?.length ?? 0,
      "error:",
      error
    );

    if (error) {
      console.error("[/api/daily-summaries] Supabase error:", error);
      return NextResponse.json(
        { data: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: Array.isArray(data) ? data : [] });
  } catch (error) {
    console.error("Error in daily-summaries API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
