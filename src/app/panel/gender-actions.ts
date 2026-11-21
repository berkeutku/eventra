"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  GENDER_FIELD,
  genderCanBeSet,
  parseGender,
} from "@/lib/gender-rules";

// Cinsiyeti henüz belirtilmemiş bir hesap için cinsiyeti bir kez kaydeder.
// Belirtilmiş cinsiyet bu yoldan değiştirilemez: serbestçe değişebilseydi
// "sadece kadınlar" yolculukları kötüye kullanılabilirdi.
export async function setGenderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  if (!genderCanBeSet(user.gender)) {
    return;
  }

  const gender = parseGender(formData.get(GENDER_FIELD));

  if (!gender) {
    return;
  }

  try {
    // isNull koşulu: iki sekmeden aynı anda gelse bile yalnızca ilk seçim kaydedilir.
    await db
      .update(users)
      .set({ gender })
      .where(and(eq(users.id, user.id), isNull(users.gender)));
  } catch (error) {
    console.error("Cinsiyet kaydedilemedi:", error);
  }

  revalidatePath("/", "layout");
}
