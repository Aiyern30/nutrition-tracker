import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) throw error;

    console.log("✅ Keep-alive ping successful:", new Date().toISOString());

    return NextResponse.json({
      status: "ok",
      message: "Supabase is alive!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Keep-alive ping failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Ping failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
