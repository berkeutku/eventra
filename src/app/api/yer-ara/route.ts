import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchPlaces } from "@/lib/geo-service";
import { takeRateSlot } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "login" }, { status: 401 });
  }

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();

  if (query.length < 3 || query.length > 100) {
    return NextResponse.json({ error: "query" }, { status: 400 });
  }

  try {
    if (!(await takeRateSlot(user.id, "geo_search", 20, 60_000))) {
      return NextResponse.json({ error: "limit" }, { status: 429 });
    }

    const outcome = await searchPlaces(query);

    if (outcome.status === "busy") {
      return NextResponse.json({ error: "busy" }, { status: 429 });
    }

    if (outcome.status === "failed") {
      return NextResponse.json({ error: "failed" }, { status: 502 });
    }

    return NextResponse.json({ results: outcome.places });
  } catch (error) {
    console.error(
      "Adres arama hatası:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}