import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countUnread } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Yalnızca oturumdaki kullanıcının okunmamış sayısını döner.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401, headers: NO_STORE });
  }

  try {
    const count = await countUnread(user.id);
    return NextResponse.json({ count }, { headers: NO_STORE });
  } catch (error) {
    console.error("Okunmamış sayısı alınamadı:", error);
    return NextResponse.json({ count: 0 }, { status: 500, headers: NO_STORE });
  }
}