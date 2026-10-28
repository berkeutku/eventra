import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { loginAttempts } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.
export const LOGIN_WINDOW_MINUTES = 15;
export const MAX_FAILED_ATTEMPTS = 5;

function windowStart(): Date {
  return new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
}

export async function isLoginBlocked(email: string): Promise<boolean> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        gt(loginAttempts.attemptedAt, windowStart()),
      ),
    );

  return row.total >= MAX_FAILED_ATTEMPTS;
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