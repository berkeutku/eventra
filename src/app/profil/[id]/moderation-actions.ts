"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { deleteAvatar } from "@/lib/profile";

// Yönetici moderasyonu: uygunsuz profil fotoğrafını kaldırır ya da tanıtım yazısı ve şehri temizler.
// Her çağrıda yönetici kontrolü yapılır; form elle gönderilse bile yetkisiz kişi işlem yapamaz.
// Kullanıcıya uygulama içi bir bildirim gider (telefona push gönderilmez).

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readTarget(formData: FormData): Promise<string | null> {
  const admin = await getCurrentUser();

  if (!admin || !isAdminEmail(admin.email)) {
    return null;
  }

  // Yanlışlıkla tıklamaya karşı onay kutusu işaretlenmiş olmalı.
  if (formData.get("confirm") !== "on") {
    return null;
  }

  const userId = String(formData.get("userId") ?? "");
  return UUID_PATTERN.test(userId) ? userId : null;
}

async function notifyUser(userId: string, body: string): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId,
      type: "profile_moderated",
      title: "Profilinde bir değişiklik yapıldı",
      body,
      link: "/panel/profil",
    });
  } catch (error) {
    console.error(
      "Moderasyon bildirimi gönderilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }
}

export async function adminRemoveAvatarAction(formData: FormData): Promise<void> {
  const userId = await readTarget(formData);

  if (!userId) {
    return;
  }

  try {
    await deleteAvatar(userId);
    console.info("Yönetici profil fotoğrafını kaldırdı:", userId);
  } catch (error) {
    console.error(
      "Profil fotoğrafı kaldırılamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return;
  }

  await notifyUser(
    userId,
    "Profil fotoğrafın topluluk kurallarına uymadığı için kaldırıldı. Kendini gösteren, uygun bir fotoğraf yükleyebilirsin.",
  );
  revalidatePath("/", "layout");
}

export async function adminClearProfileTextAction(formData: FormData): Promise<void> {
  const userId = await readTarget(formData);

  if (!userId) {
    return;
  }

  try {
    await db.update(users).set({ bio: null, city: null }).where(eq(users.id, userId));
    console.info("Yönetici tanıtım yazısını ve şehri temizledi:", userId);
  } catch (error) {
    console.error(
      "Profil yazısı temizlenemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return;
  }

  await notifyUser(
    userId,
    "Tanıtım yazın ve şehir bilgin topluluk kurallarına uymadığı için silindi. Profilini yeniden düzenleyebilirsin.",
  );
  revalidatePath("/", "layout");
}
