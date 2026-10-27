import assert from "node:assert/strict";
import { normalizeText, scoreRides } from "../src/lib/matching";
import type { RideItem } from "../src/lib/ride-utils";

let passed = 0;
let failed = 0;

function test(name: string, run: () => void) {
  try {
    run();
    passed += 1;
    console.log(`  geçti: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  BAŞARISIZ: ${name}`);
    console.error(error instanceof Error ? `    ${error.message}` : error);
  }
}

function makeRide(overrides: Partial<RideItem> = {}): RideItem {
  return {
    id: "r1",
    eventId: "e1",
    driverName: "Sürücü",
    origin: "Stadyum",
    destination: "Kadıköy",
    meetingPoint: "Ana kapı",
    departureTime: "23:30",
    durationMinutes: 45,
    seats: 3,
    totalCost: 600,
    createdAt: "2026-10-24T00:00:00.000Z",
    passengerCount: 0,
    joined: false,
    isOwn: false,
    driverVerified: false,
    ...overrides,
  };
}

function reasonPoints(
  scored: ReturnType<typeof scoreRides>[number],
  key: string,
): number | undefined {
  return scored.reasons.find((reason) => reason.key === key)?.points;
}

test("Türkçe karakterler normalleştirilir", () => {
  assert.equal(normalizeText("Kadıköy"), "kadikoy");
  assert.equal(normalizeText("İSTANBUL"), "istanbul");
  assert.equal(normalizeText("ŞİŞLİ"), "sisli");
  assert.equal(normalizeText("  Beşiktaş,  İskele "), "besiktas iskele");
});

test("büyük harfli ve aksansız girdi tam eşleşir (50 puan)", () => {
  const rides = [makeRide({ id: "a", destination: "Kadıköy" })];

  for (const input of ["KADIKÖY", "kadikoy", "Kadıköy"]) {
    const [scored] = scoreRides(rides, { destination: input, preferredTime: "" });
    assert.equal(reasonPoints(scored, "destination"), 50, input);
  }
});

test("eşleşen varış yeri eşleşmeyenden yüksek puan alır", () => {
  const rides = [
    makeRide({ id: "a", destination: "Kadıköy" }),
    makeRide({ id: "b", destination: "Beşiktaş" }),
  ];
  const [a, b] = scoreRides(rides, {
    destination: "kadikoy",
    preferredTime: "",
  });

  assert.equal(reasonPoints(b, "destination"), 0);
  assert.ok(a.score > b.score);
});

test("yazarken kısmi girdi (önek) 40 puan alır", () => {
  const [scored] = scoreRides([makeRide({ destination: "Kadıköy" })], {
    destination: "kadı",
    preferredTime: "",
  });
  assert.equal(reasonPoints(scored, "destination"), 40);
});

test("ortak sözcük 25 puan alır", () => {
  const [scored] = scoreRides([makeRide({ destination: "Üsküdar Sahil" })], {
    destination: "Üsküdar Meydanı",
    preferredTime: "",
  });
  assert.equal(reasonPoints(scored, "destination"), 25);
});

test("kalkış saati farkı puanlanır (gece yarısı geçişi dahil)", () => {
  const close = scoreRides([makeRide({ departureTime: "22:45" })], {
    destination: "",
    preferredTime: "23:00",
  })[0];
  assert.equal(reasonPoints(close, "time"), 20);

  const overMidnight = scoreRides([makeRide({ departureTime: "00:10" })], {
    destination: "",
    preferredTime: "23:50",
  })[0];
  assert.equal(reasonPoints(overMidnight, "time"), 14);

  const far = scoreRides([makeRide({ departureTime: "23:30" })], {
    destination: "",
    preferredTime: "12:00",
  })[0];
  assert.equal(reasonPoints(far, "time"), 0);
});

test("tercih girilmezse yalnızca masraf ve koltuk puanlanır", () => {
  const [scored] = scoreRides([makeRide()], {
    destination: "",
    preferredTime: "",
  });
  assert.deepEqual(
    scored.reasons.map((reason) => reason.key),
    ["cost", "seats"],
  );
  assert.equal(
    scored.reasons.reduce((sum, reason) => sum + reason.max, 0),
    30,
  );
});

test("geçersiz saat girdisi yok sayılır", () => {
  const [scored] = scoreRides([makeRide()], {
    destination: "",
    preferredTime: "25:99",
  });
  assert.equal(
    scored.reasons.some((reason) => reason.key === "time"),
    false,
  );
});

test("en ucuz yolculuk 20, en pahalısı 0 masraf puanı alır", () => {
  const rides = [
    makeRide({ id: "pahali", totalCost: 600, seats: 3 }),
    makeRide({ id: "ucuz", totalCost: 200, seats: 1 }),
  ];
  const [pahali, ucuz] = scoreRides(rides, {
    destination: "",
    preferredTime: "",
  });

  assert.equal(reasonPoints(pahali, "cost"), 0);
  assert.equal(reasonPoints(ucuz, "cost"), 20);
});

test("dolu yolculuk işaretlenir ve koltuk puanı 0 olur", () => {
  const [scored] = scoreRides([makeRide({ seats: 3, passengerCount: 3 })], {
    destination: "",
    preferredTime: "",
  });
  assert.equal(scored.full, true);
  assert.equal(reasonPoints(scored, "seats"), 0);
});

test("son koltuk 5, bol koltuk 10 puan alır", () => {
  const rides = [
    makeRide({ id: "son", seats: 3, passengerCount: 2 }),
    makeRide({ id: "bol", seats: 3, passengerCount: 0 }),
  ];
  const [son, bol] = scoreRides(rides, { destination: "", preferredTime: "" });

  assert.equal(reasonPoints(son, "seats"), 5);
  assert.equal(reasonPoints(bol, "seats"), 10);
});

test("puan her zaman 0 ile 100 arasındadır (rastgele 300 deneme)", () => {
  let seed = 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const places = ["Kadıköy", "Beşiktaş", "Üsküdar", "Şişli", "Çankaya"];

  for (let i = 0; i < 300; i++) {
    const seats = 1 + Math.floor(random() * 6);
    const rides = Array.from({ length: 1 + Math.floor(random() * 5) }, (_, n) =>
      makeRide({
        id: `r${n}`,
        destination: places[Math.floor(random() * places.length)],
        departureTime: `${String(Math.floor(random() * 24)).padStart(2, "0")}:${String(Math.floor(random() * 60)).padStart(2, "0")}`,
        seats,
        passengerCount: Math.floor(random() * (seats + 1)),
        totalCost: Math.floor(random() * 5001),
      }),
    );

    for (const scored of scoreRides(rides, {
      destination: places[Math.floor(random() * places.length)],
      preferredTime: "23:15",
    })) {
      assert.ok(scored.score >= 0 && scored.score <= 100, String(scored.score));
    }
  }
});

test("girdi listesi değiştirilmez", () => {
  const rides = [makeRide({ id: "a" }), makeRide({ id: "b" })];
  scoreRides(rides, { destination: "x", preferredTime: "" });
  assert.deepEqual(
    rides.map((ride) => ride.id),
    ["a", "b"],
  );
});

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}