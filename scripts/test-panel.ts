import { pickNextRide } from "../src/lib/panel";
import { parseTab } from "../src/lib/panel-tabs";
import type { RideWithEvent } from "../src/lib/ride-utils";

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

function ride(id: string, startsAt: string, departureTime = "23:30"): RideWithEvent {
  return { id, eventStartsAt: startsAt, departureTime } as unknown as RideWithEvent;
}

check("hiç yolculuk yoksa null", pickNextRide([], [], NOW) === null);
check("yalnızca geçmiş yolculuklar varsa null", pickNextRide([ride("a", hours(-30))], [ride("b", hours(-100))], NOW) === null);

const soonest = pickNextRide([ride("d1", hours(48))], [ride("p1", hours(24)), ride("p2", hours(72))], NOW);
check("en yakın yolculuk seçilir (yolcu)", soonest?.ride.id === "p1" && soonest.role === "passenger");

const driverFirst = pickNextRide([ride("d1", hours(5))], [ride("p1", hours(24))], NOW);
check("sürücü yolculuğu daha yakınsa o seçilir", driverFirst?.ride.id === "d1" && driverFirst.role === "driver");

check("süren etkinlik (3 saat önce başlamış) hâlâ sıradaki sayılır", pickNextRide([ride("d1", hours(-3))], [], NOW)?.ride.id === "d1");
check("6 saatten eski etkinlik sayılmaz", pickNextRide([ride("d1", hours(-7))], [], NOW) === null);
check("aynı başlangıçta kalkış saati erken olan önce gelir", pickNextRide([ride("d1", hours(10), "23:30")], [ride("p1", hours(10), "21:00")], NOW)?.ride.id === "p1");
check("geçersiz tarihli yolculuk atlanır", pickNextRide([ride("d1", "bozuk")], [ride("p1", hours(10))], NOW)?.ride.id === "p1");

check("sekme yoksa genel", parseTab(undefined) === "genel");
check("geçerli sekme kabul edilir", parseTab("favoriler") === "favoriler" && parseTab("ayarlar") === "ayarlar");
check("geçersiz sekme genel olur", parseTab("admin") === "genel" && parseTab("") === "genel");
check("dizi değerinde ilk eleman kullanılır", parseTab(["basarilar", "ayarlar"]) === "basarilar");

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}