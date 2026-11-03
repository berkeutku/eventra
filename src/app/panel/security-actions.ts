"use server";

import { destroyOtherSessions, getCurrentUser } from "@/lib/auth";

export async function signOutOtherDevicesAction(): Promise<{
  ok: boolean;
  closed: number;
}> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, closed: 0 };
  }

  try {
    return { ok: true, closed: await destroyOtherSessions(user.id) };
  } catch (error) {
    console.error(
      "Oturumlar kapatılamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { ok: false, closed: 0 };
  }
}