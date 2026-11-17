import { createHash } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { loginAttempts } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.
export const LOGIN_WINDOW_MINUTES = 15;
export const MAX_FAILED_ATTEMPTS = 5;
// Aynı ağdan (IP) 15 dakikada en fazla bu kadar hatalı deneme. Üniversite gibi ortak
// ağlarda gerçek kullanıcıları engellememek için e-posta sınırından çok daha yüksek tutulur.
export const MAX_FAILED_PER_IP = 30;

// IP adresi ham olarak saklanmaz: tek yönlü özeti, e-posta alanında "ip:" önekiyle tutulur.
export function ipThrottleKey(ip: string): string {
  return `ip:${createHash("sha256").update(`eventra-login:${ip}`).digest("hex")}`;
}

function windowStart(): Date {
  return new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
}

// key: e-posta adresi ya da ipThrottleKey() çıktısı. max: bu anahtar için izin verilen hatalı deneme.
export async function isLoginBlocked(
  key: string,
  max: number = MAX_FAILED_ATTEMPTS,
): Promise<boolean> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, key),
        gt(loginAttempts.attemptedAt, windowStart()),
      ),
    );

  return row.total >= max;
}

export async function recordFailedLogin(email: string): Promise<void> {
  await db.insert(loginAttempts).values({ email });

  // Pencere dışına düşen eski kayıtları temizle, tablo şişmesin.
  await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.attemptedAt, windowStart()));
}

export async function clearFailedLogins(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
}