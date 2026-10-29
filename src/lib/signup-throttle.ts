import { createHash } from "node:crypto";
import { gt, inArray, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { signupAttempts } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.

export const SIGNUP_WINDOW_MINUTES = 60;
export const MAX_SIGNUPS_PER_IP = 8;
export const MAX_SIGNUPS_GLOBAL = 120;

export type SignupCheck = "ok" | "ip_limited" | "global_limited";

type Limits = { perIp?: number; global?: number };

// IP adresi ham olarak saklanmaz: tek yönlü özeti alınır.
export function hashIp(ip: string): string {
  return createHash("sha256").update(`eventra-signup:${ip}`).digest("hex");
}

function windowStart(): Date {
  return new Date(Date.now() - SIGNUP_WINDOW_MINUTES * 60 * 1000);
}

// ip null ise (başlık yok, örn. yerel geliştirme) yalnızca genel sınır uygulanır.
export async function checkSignupAllowed(
  ip: string | null,
  limits?: Limits,
): Promise<SignupCheck> {
  const perIp = limits?.perIp ?? MAX_SIGNUPS_PER_IP;
  const global = limits?.global ?? MAX_SIGNUPS_GLOBAL;
  const hashed = ip ? hashIp(ip) : "";

  const [row] = await db
    .select({
      ipTotal: sql<number>`count(*) filter (where ${signupAttempts.ipHash} = ${hashed})::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(signupAttempts)
    .where(gt(signupAttempts.createdAt, windowStart()));

  if (ip && row.ipTotal >= perIp) {
    return "ip_limited";
  }

  if (row.total >= global) {
    return "global_limited";
  }

  return "ok";
}

// Başarılı bir kayıttan sonra çağrılır. 24 saatten eski kayıtları da temizler.
export async function recordSignup(ip: string | null): Promise<void> {
  await db.insert(signupAttempts).values({ ipHash: hashIp(ip ?? "unknown") });
  await db
    .delete(signupAttempts)
    .where(lt(signupAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}

export async function clearSignupRecords(ips: string[]): Promise<void> {
  if (ips.length === 0) {
    return;
  }

  await db
    .delete(signupAttempts)
    .where(inArray(signupAttempts.ipHash, ips.map(hashIp)));
}