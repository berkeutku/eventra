import assert from "node:assert/strict";
import {
  MEETING_POINTS,
  findMeetingPoint,
  rankMeetingPoints,
} from "../src/lib/meeting-points";

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

test("puanlar beklenen değerlerde", () => {
  const scores = Object.fromEntries(
    rankMeetingPoints().map((item) => [item.point.name, item.score]),
  );

  assert.deepEqual(scores, {
    "Kuzey çıkışı": 90,
    "Ana kapı önü": 70,
    "Otopark girişi": 55,
    "Batı kapısı önü": 45,
  });
});

test("sıralama puana göre azalan", () => {
  assert.deepEqual(
    rankMeetingPoints().map((item) => item.point.name),
    ["Kuzey çıkışı", "Ana kapı önü", "Otopark girişi", "Batı kapısı önü"],
  );
});

test("sıra numaraları 1'den başlayıp ardışık gider", () => {
  assert.deepEqual(
    rankMeetingPoints().map((item) => item.rank),
    [1, 2, 3, 4],
  );
});

test("her noktanın azami puanı toplamı 100", () => {
  for (const item of rankMeetingPoints()) {
    assert.equal(
      item.reasons.reduce((sum, reason) => sum + reason.max, 0),
      100,
    );
  }
});

test("puanlar 0 ile 100 arasında", () => {
  for (const item of rankMeetingPoints()) {
    assert.ok(item.score >= 0 && item.score <= 100, String(item.score));
  }
});

test("puan dökümünün toplamı skora eşit", () => {
  for (const item of rankMeetingPoints()) {
    assert.equal(
      item.reasons.reduce((sum, reason) => sum + reason.points, 0),
      item.score,
    );
  }
});

test("ad eşleştirme Türkçe karakter ve harf boyutunu yok sayar", () => {
  assert.equal(findMeetingPoint("KUZEY ÇIKIŞI")?.id, "north-exit");
  assert.equal(findMeetingPoint("kuzey cikisi")?.id, "north-exit");
  assert.equal(findMeetingPoint("  Ana kapı önü ")?.id, "main-gate");
});

test("bilinmeyen ya da boş ad eşleşmez", () => {
  assert.equal(findMeetingPoint("Mavi tabela"), null);
  assert.equal(findMeetingPoint(""), null);
  assert.equal(findMeetingPoint("   "), null);
});

test("sıralama girdi listesini değiştirmez", () => {
  const reversed = [...MEETING_POINTS].reverse();
  const before = reversed.map((point) => point.id);

  const ranked = rankMeetingPoints(reversed);

  assert.deepEqual(
    reversed.map((point) => point.id),
    before,
  );
  assert.deepEqual(
    ranked.map((item) => item.point.id),
    ["north-exit", "main-gate", "parking-entrance", "west-gate"],
  );
});

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}