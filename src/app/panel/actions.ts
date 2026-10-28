"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Giriş yapmış kullanıcının aktif rolünü değiştirir (sürücü <-> yolcu).
// Kimlik her zaman oturumdan alınır, formdan gelen bir kullanıcı numarasına güvenilmez.
// Rol gerçekten bu istekten sonra istenen değerdeyse true döner.
export async function switchRoleAction(formData: FormData): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const role = String(formData.get("role") ?? "");

  if (role !== "driver" && role !== "passenger") {
    return false;
  }

  if (role === user.role) {
    return true;
  }

  try {
    await db.update(users).set({ role }).where(eq(users.id, user.id));
  } catch (error) {
    console.error("Rol değiştirilemedi:", error);
    return false;
  }

  // Üst menü ve panel rolü sunucuda okuduğu için tüm sayfaları tazele.
  revalidatePath("/", "layout");
  return true;
}