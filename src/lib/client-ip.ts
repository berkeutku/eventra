import { headers } from "next/headers";

// Vercel bu başlıkları kendisi doldurur. Başlık yoksa (yerel geliştirme) null döner.
export async function readClientIp(): Promise<string | null> {
  const list = await headers();
  const real = list.get("x-real-ip")?.trim();

  if (real) {
    return real;
  }

  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}
