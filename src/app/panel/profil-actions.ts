"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteAvatar,
  saveAvatar,
  saveProfile,
} from "@/lib/profile";
import {
  AVATAR_FIELD,
  BIO_FIELD,
  CITY_FIELD,
  INTERESTS_FIELD,
  THEME_FIELD,
  avatarFileError,
  parseInterests,
  parseTheme,
  prepareBio,
  prepareCity,
} from "@/lib/profile-rules";
import { takeRateSlot } from "@/lib/rate-limit";

export type ProfileFormState = {
  errors?: Partial<Record<"bio" | "city" | "theme" | "interests", string>>;
  message?: string;
};

export async function updateProfileAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris?next=/panel/profil");
  }

  const allowed = await takeRateSlot(user.id, "profile_update", 30, 3_600_000);

  if (!allowed) {
    return {
      message: "Kısa sürede çok fazla değişiklik yaptın. Biraz sonra tekrar dene.",
    };
  }

  const bio = prepareBio(formData.get(BIO_FIELD));
  const city = prepareCity(formData.get(CITY_FIELD));
  const theme = parseTheme(formData.get(THEME_FIELD));
  const interests = parseInterests(formData.getAll(INTERESTS_FIELD));

  const errors: NonNullable<ProfileFormState["errors"]> = {};

  if (!bio.ok) errors.bio = bio.error;
  if (!city.ok) errors.city = city.error;
  if (theme === null) errors.theme = "Geçerli bir tema seç.";
  if (!interests.ok) errors.interests = interests.error;

  if (!bio.ok || !city.ok || theme === null || !interests.ok) {
    return { errors };
  }

  try {
    await saveProfile(user.id, {
      bio: bio.value,
      city: city.value,
      theme,
      interests: interests.value,
    });
  } catch (error) {
    console.error("Profil kaydedilemedi:", error);
    return { message: "Profil kaydedilemedi. Lütfen biraz sonra tekrar dene." };
  }

  revalidatePath("/", "layout");
  redirect("/panel");
}

export type AvatarResult = { ok: boolean; message?: string };

// Tarayıcı fotoğrafı 320x320 JPEG'e küçültüp gönderir; sunucu yine de boyutu ve JPEG imzasını doğrular.
export async function uploadAvatarAction(
  formData: FormData,
): Promise<AvatarResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Önce giriş yapmalısın." };
  }

  const allowed = await takeRateSlot(user.id, "avatar_upload", 10, 3_600_000);

  if (!allowed) {
    return {
      ok: false,
      message: "Kısa sürede çok fazla fotoğraf yükledin. Biraz sonra tekrar dene.",
    };
  }

  const file = formData.get(AVATAR_FIELD);

  if (!(file instanceof File)) {
    return { ok: false, message: "Fotoğraf seçilmedi." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = avatarFileError(bytes);

  if (problem) {
    return { ok: false, message: problem };
  }

  try {
    await saveAvatar(user.id, Buffer.from(bytes).toString("base64"));
  } catch (error) {
    console.error("Fotoğraf kaydedilemedi:", error);
    return { ok: false, message: "Fotoğraf kaydedilemedi. Lütfen tekrar dene." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<AvatarResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Önce giriş yapmalısın." };
  }

  try {
    await deleteAvatar(user.id);
  } catch (error) {
    console.error("Fotoğraf silinemedi:", error);
    return { ok: false, message: "Fotoğraf silinemedi. Lütfen tekrar dene." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
