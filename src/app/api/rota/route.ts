import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePointsBody } from "@/lib/geo-rules";
import { getRoute } from "@/lib/geo-service";
import { takeRateSlot } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "login" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }

  const points = parsePointsBody(body);

  if (!points) {
    return NextResponse.json({ error: "points" }, { status: 400 });
  }

  try {
    if (!(await takeRateSlot(user.id, "geo_route", 30, 600_000))) {
      return NextResponse.json({ error: "limit" }, { status: 429 });
    }

    const outcome = await getRoute(points);

    if (outcome.status === "busy") {
      return NextResponse.json({ error: "busy" }, { status: 429 });
    }

    if (outcome.status === "failed") {
      return NextResponse.json({ error: "failed" }, { status: 502 });
    }

    return NextResponse.json({
      distanceMeters: outcome.route.distanceMeters,
      durationSeconds: outcome.route.durationSeconds,
      path: outcome.route.path,
    });
  } catch (error) {
    console.error(
      "Rota hatası:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}