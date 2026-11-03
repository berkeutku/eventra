import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { actionLog } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

// Pencere içinde "max" işlemden az yapıldıysa bir hak ayırır ve true döner, doluysa false döner.
// İki eşzamanlı istek sınırı birkaç işlem aşabilir, bu bir kötüye kullanım freni, kesin sayaç değil.
export async function takeRateSlot(
  userId: string,
  kind: string,
  max: number,
  windowMs: number,
  now: Date = new Date(),
): Promise<boolean> {
  const since = new Date(now.getTime() - windowMs);

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(actionLog)
    .where(
      and(
        eq(actionLog.userId, userId),
        eq(actionLog.kind, kind),
        gte(actionLog.createdAt, since),
      ),
    );

  if (row.total >= max) {
    return false;
  }

  await db.insert(actionLog).values({ userId, kind, createdAt: now });

  // 24 saatten eski kayıtlar temizlenir, tablo şişmesin.
  await db
    .delete(actionLog)
    .where(lt(actionLog.createdAt, new Date(now.getTime() - 24 * 3_600_000)));

  return true;
}