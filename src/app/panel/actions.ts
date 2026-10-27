"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Giriş yapmış kullanıcının aktif rolünü değiştirir (sürücü <-> yolcu).
// Kimlik her zaman oturumdan alınır, formdan gelen bir kullanıcı numarasına güvenilmez.
export async function switchRoleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const role = String(formData.get("role") ?? "");

  if (role !== "driver" && role !== "passenger") {
    return;
  }

  if (role === user.role) {
    return;
  }

  await db.update(users).set({ role }).where(eq(users.id, user.id));

  // Üst menü ve panel rolü sunucuda okuduğu için tüm sayfaları tazele.
  revalidatePath("/", "layout");
}