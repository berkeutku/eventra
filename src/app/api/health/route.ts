import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Site ve veritabanı ayakta mı? Dış izleme servisleri (ör. UptimeRobot) bu adresi düzenli yoklar.
// Gizli bilgi, sürüm ya da hata ayrıntısı döndürmez.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  } catch (error) {
    console.error("Sağlık kontrolü: veritabanına ulaşılamadı:", error);
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: NO_STORE },
    );
  }
}
