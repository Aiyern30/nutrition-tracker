import { NextResponse } from "next/server";

async function getFatSecretToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "basic",
  });

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to get token");
  return res.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const page = searchParams.get("page") || "0";
  const region = searchParams.get("region") || "MY";
  const language = searchParams.get("language") || "en";

  if (!query) {
    return NextResponse.json({ foods: [] });
  }

  const tokenData = await getFatSecretToken();

  const res = await fetch(
    `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
      query
    )}&page_number=${page}&region=${region}&language=${language}&format=json`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
