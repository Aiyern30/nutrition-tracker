import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const days = searchParams.get("days");

  // Get the user's access token from the request headers (if sent from client)
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  // Use the user's access token if available, otherwise fallback to anon key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : undefined
  );

  if (!user_id) {
    return Response.json({ data: [] });
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

  // Debug: log what is returned
  console.log(
    "[/api/daily-summaries] user_id:", user_id,
    "days:", days,
    "returned rows:", data?.length ?? 0,
    "first row:", data?.[0] ?? null
  );

  if (error) {
    return Response.json({ data: [], error: error.message }, { status: 500 });
  }

  // Always return an array (even if empty)
  return Response.json({ data: Array.isArray(data) ? data : [] });
}
