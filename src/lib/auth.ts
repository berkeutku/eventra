import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE = "eventra_session";
const SESSION_DAYS = 7;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "driver" | "passenger";
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
  });

  // Süresi dolmuş oturumları fırsat buldukça temizle. Hata girişi engellemesin.
  try {
    await deleteExpiredSessions();
  } catch (error) {
    console.error("Süresi dolan oturumlar silinemedi:", error);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())),
    )
    .limit(1);

  return rows[0] ?? null;
});

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }

  cookieStore.delete(SESSION_COOKIE);
}

// Kullanıcının süresi dolmamış açık oturum sayısı (bu cihaz dahil).
export async function countActiveSessions(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())));

  return row.total;
}

// Bu cihazdaki oturum hariç kullanıcının tüm oturumlarını kapatır. Kapatılan sayıyı döner.
export async function destroyOtherSessions(userId: string): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return 0;
  }

  const removed = await db
    .delete(sessions)
    .where(
      and(eq(sessions.userId, userId), ne(sessions.id, hashToken(token))),
    )
    .returning({ id: sessions.id });

  return removed.length;
}