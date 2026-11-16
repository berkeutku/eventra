import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { collectUserData } from "@/lib/data-export";
import {
  EXPORT_MAX_PER_HOUR,
  EXPORT_RATE_KIND,
  EXPORT_WINDOW_MS,
  exportFileName,
  wrapExport,
} from "@/lib/data-export-rules";
import { takeRateSlot } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Oturumdaki kullanıcının kendi verilerini JSON dosyası olarak indirir.
// POST kullanılır: başka bir siteden açılan bağlantı oturum çerezi ile veri indirtemez.
export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Önce giriş yapmalısın." },
      { status: 401, headers: NO_STORE },
    );
  }

  const allowed = await takeRateSlot(
    user.id,
    EXPORT_RATE_KIND,
    EXPORT_MAX_PER_HOUR,
    EXPORT_WINDOW_MS,
  );

  if (!allowed) {
    return NextResponse.json(
      { message: "Çok sık indirme denedin. Bir süre sonra tekrar dene." },
      { status: 429, headers: NO_STORE },
    );
  }

  try {
    const now = new Date();
    const data = await collectUserData(user.id);
    const body = JSON.stringify(wrapExport(data, now), null, 2);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFileName(now)}"`,
        ...NO_STORE,
      },
    });
  } catch (error) {
    console.error("Veri dışa aktarma başarısız:", error);
    return NextResponse.json(
      { message: "Verilerin hazırlanamadı. Lütfen biraz sonra tekrar dene." },
      { status: 500, headers: NO_STORE },
    );
  }
}
