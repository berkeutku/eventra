import { NextResponse } from "next/server";
import { runBiletimgoSync } from "@/lib/biletimgo/sync";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HEADERS = { "Cache-Control": "no-store" };

// Günlük biletimGO senkronu. Yalnızca Vercel Cron (ya da CRON_SECRET'ı bilen biri) çağırabilir.
export async function GET(request: Request) {
  const auth = checkCronAuth(
    request.headers.get("authorization"),
    process.env.CRON_SECRET,
  );

  if (auth === "not_configured") {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503, headers: HEADERS },
    );
  }

  if (auth === "unauthorized") {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: HEADERS },
    );
  }

  const token = process.env.BILETIMGO_API_TOKEN ?? "";

  if (!token) {
    return NextResponse.json(
      { error: "token_not_configured" },
      { status: 503, headers: HEADERS },
    );
  }

  try {
    const result = await runBiletimgoSync({ token, apply: true });

    // Yalnızca durum ve sayılar döner. Token, adres ve veri içeriği asla döndürülmez.
    const body = {
      status: result.status,
      fetched: result.fetched,
      valid: result.valid,
      skipped: result.skipped,
      inserted: result.inserted,
      updated: result.updated,
      reactivated: result.reactivated,
      missed: result.missed,
      deactivated: result.deactivated,
      protectedChanges: result.protectedChanges,
      errorCode: result.errorCode,
    };

    const status =
      result.status === "success" ? 200 : result.status === "locked" ? 409 : 500;

    return NextResponse.json(body, { status, headers: HEADERS });
  } catch {
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: HEADERS },
    );
  }
}