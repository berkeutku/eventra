import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadChat } from "@/lib/ride-chat";

export const dynamic = "force-dynamic";

// Sohbet açıkken tarayıcı bu adresi düzenli aralıklarla yoklar.
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "login" }, { status: 401 });
  }

  const rideId = new URL(request.url).searchParams.get("ride") ?? "";

  try {
    const chat = await loadChat(rideId, user.id);

    if (!chat) {
      return NextResponse.json({ error: "forbidden" }, { status: 404 });
    }

    return NextResponse.json(
      { items: chat.items, phase: chat.access.phase },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Sohbet okunamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}