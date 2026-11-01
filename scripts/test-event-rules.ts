import {
  rideBlockMessages,
  rideCreationBlockReason,
} from "../src/lib/event-rules";

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

const NOW = new Date("2026-11-10T12:00:00Z");
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

check("demo etkinlik geçmişte olsa da engellenmez", rideCreationBlockReason({ source: "demo", startsAt: hours(-500) }, NOW) === null);
check("kaynağı belirtilmeyen etkinlik engellenmez", rideCreationBlockReason({ startsAt: hours(-500) }, NOW) === null);
check("gerçek etkinlik, yaklaşan: serbest", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(24), endsAt: hours(27) }, NOW) === null);
check("bitişten 11 saat sonra hâlâ serbest", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(-16), endsAt: hours(-11) }, NOW) === null);
check("bitişten 13 saat sonra engellenir (ended)", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(-18), endsAt: hours(-13) }, NOW) === "ended");
check("24 saat süren etkinlik serbest", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(10), endsAt: hours(34) }, NOW) === null);
check("24 saati aşan etkinlik engellenir (multi_day)", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(10), endsAt: hours(34.5) }, NOW) === "multi_day");
check("çok günlük etkinlik engellenir", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(10), endsAt: hours(200) }, NOW) === "multi_day");
check("pasif etkinlik engellenir (inactive)", rideCreationBlockReason({ source: "biletimgo", isActive: false, startsAt: hours(24), endsAt: hours(27) }, NOW) === "inactive");
check("bitiş yoksa başlangıç + 3 saat kabul edilir", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(-14) }, NOW) === "ended" && rideCreationBlockReason({ source: "biletimgo", startsAt: hours(-14.5) }, NOW) === "ended" && rideCreationBlockReason({ source: "biletimgo", startsAt: hours(-10) }, NOW) === null);
check("bitiş başlangıçtan önceyse varsayılan süre kullanılır", rideCreationBlockReason({ source: "biletimgo", startsAt: hours(5), endsAt: hours(1) }, NOW) === null);
check("geçersiz tarih engellenir", rideCreationBlockReason({ source: "biletimgo", startsAt: "bozuk" }, NOW) === "ended");
check("her neden için mesaj var", Object.values(rideBlockMessages).every((m) => m.length > 10));

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}