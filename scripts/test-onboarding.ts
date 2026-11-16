import {
  onboardingAction,
  onboardingSteps,
  onboardingVisible,
  type OnboardingInput,
} from "../src/lib/onboarding-rules";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean) {
  if (ok) {
    passed += 1;
    console.log(`  geçti: ${name}`);
  } else {
    failed += 1;
    console.log(`  BAŞARISIZ: ${name}`);
  }
}

const base: OnboardingInput = {
  hasFavorite: false,
  verifiedCount: 0,
  totalRides: 0,
  pushEnabled: false,
  isDriver: false,
  latestVerified: null,
};

function done(input: OnboardingInput): string {
  return onboardingSteps(input)
    .map((step) => (step.done ? "1" : "0"))
    .join("");
}

function pureChecks() {
  check("yeni kullanıcı: hiçbir adım tamam değil", done(base) === "0000");

  check(
    "favorisi olan: yalnızca etkinlik seçme tamam",
    done({ ...base, hasFavorite: true }) === "1000",
  );

  check(
    "bileti doğrulayan: seçme ve doğrulama tamam",
    done({ ...base, verifiedCount: 1 }) === "1100",
  );

  check(
    "yolculuğu olan (doğrulama sayısı 0 olsa bile): ilk üç adım tamam",
    done({ ...base, totalRides: 1 }) === "1110",
  );

  check(
    "bildirim açık: son adım tamam",
    done({ ...base, pushEnabled: true }) === "0001",
  );

  check(
    "adım 3 metni role göre değişir",
    onboardingSteps({ ...base, isDriver: true })[2].text ===
      "Bir yolculuk oluştur" &&
      onboardingSteps(base)[2].text === "Bir yolculuğa katıl",
  );

  check(
    "kart yalnızca ilk yolculuğa kadar görünür",
    onboardingVisible(base) && !onboardingVisible({ ...base, totalRides: 1 }),
  );

  check(
    "doğrulama yoksa düğme etkinlikler sayfasına gider",
    onboardingAction(base).href === "/events",
  );

  const event = { id: "konser-1", title: "Konser" };

  check(
    "doğruladı ama yolculuk yok: düğme o etkinliğe gider (yolcu)",
    onboardingAction({ ...base, verifiedCount: 1, latestVerified: event })
      .href === "/events/konser-1",
  );

  check(
    "sürücü için düğme metni yolculuk oluşturmaya yönlendirir",
    onboardingAction({
      ...base,
      verifiedCount: 1,
      latestVerified: event,
      isDriver: true,
    }).label === "Bu etkinlik için yolculuk oluştur",
  );

  check(
    "yolculuğu var, bildirim kapalı: düğme ayarlara gider",
    onboardingAction({ ...base, verifiedCount: 1, totalRides: 1 }).href ===
      "/panel/ayarlar",
  );
}

async function dbChecks() {
  const env = process as unknown as { loadEnvFile?: (path?: string) => void };

  if (!process.env.DATABASE_URL) {
    try {
      env.loadEnvFile?.(".env");
    } catch {
      // .env yoksa ortam değişkeni başka yoldan verilmiş olmalı.
    }
  }

  const { db } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { getOnboardingData } = await import("../src/lib/onboarding");
  const { inArray } = await import("drizzle-orm");

  const tag = `ob-${Date.now()}`;
  const userIds: string[] = [];

  try {
    const [created] = await db
      .insert(schema.users)
      .values({
        name: "Onboarding Test",
        email: `${tag}@example.test`,
        passwordHash: "x",
      })
      .returning({ id: schema.users.id });
    userIds.push(created.id);

    const empty = await getOnboardingData(created.id);
    check(
      "yeni hesapta doğrulama ve bildirim yok",
      empty.verifiedCount === 0 &&
        empty.latestVerified === null &&
        !empty.pushEnabled,
    );

    const [event] = await db
      .select({ id: schema.events.id, title: schema.events.title })
      .from(schema.events)
      .limit(1);

    if (event) {
      await db.insert(schema.ticketVerifications).values({
        userId: created.id,
        eventId: event.id,
        codeHash: `${tag}-hash`,
      });

      await db.insert(schema.pushSubscriptions).values({
        userId: created.id,
        endpoint: `https://example.test/${tag}`,
        p256dh: "x",
        auth: "x",
      });

      const filled = await getOnboardingData(created.id);
      check(
        "doğrulama kaydı en son etkinlik olarak döner",
        filled.verifiedCount === 1 && filled.latestVerified?.id === event.id,
      );
      check("bildirim aboneliği görülür", filled.pushEnabled);
    }
  } finally {
    // Kullanıcının silinmesi doğrulama ve abonelik kayıtlarını zincirleme siler.
    if (userIds.length > 0) {
      await db.delete(schema.users).where(inArray(schema.users.id, userIds));
    }
  }
}

async function main() {
  pureChecks();

  try {
    await dbChecks();
  } catch (error) {
    failed += 1;
    console.log(
      "  BAŞARISIZ: veritabanı testi çalışmadı:",
      error instanceof Error ? error.message : error,
    );
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
