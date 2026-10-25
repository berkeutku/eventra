import assert from "node:assert/strict";
import {
  generateDemoTicketCode,
  normalizeTicketCode,
  validateTicketCode,
} from "../src/lib/ticket-provider";

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

test("üretilen 500 demo kodun hepsi geçerli", () => {
  for (let i = 0; i < 500; i++) {
    const code = generateDemoTicketCode();
    assert.equal(validateTicketCode(code).status, "valid", code);
  }
});

test("üretilen kod EVT-XXX-XXX biçiminde", () => {
  assert.match(generateDemoTicketCode(), /^EVT-[A-Z2-9]{3}-[A-Z2-9]{3}$/);
});

test("küçük harf, boşluk ve tire farkı kabul edilir", () => {
  const code = generateDemoTicketCode();
  const messy = ` ${code.toLowerCase().replace(/-/g, " ")} `;
  assert.equal(validateTicketCode(messy).status, "valid");
  assert.equal(normalizeTicketCode(messy), normalizeTicketCode(code));
});

test("sağlama karakteri değişirse kod reddedilir", () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let i = 0; i < 100; i++) {
    const code = generateDemoTicketCode();
    const last = code[code.length - 1];
    const other = alphabet[(alphabet.indexOf(last) + 1) % alphabet.length];
    const tampered = code.slice(0, -1) + other;
    assert.equal(validateTicketCode(tampered).status, "rejected", tampered);
  }
});

test("biçimi bozuk kodlar 'malformed' döner", () => {
  const bad = ["", "abc", "EVT-123", "XYZ-ABC-DEF", "EVT-OOO-111", "EVT-ABC-DEFG"];

  for (const input of bad) {
    assert.equal(validateTicketCode(input).status, "malformed", input);
  }
});

test("aynı kod için normalleştirme tutarlı", () => {
  const code = generateDemoTicketCode();
  assert.equal(normalizeTicketCode(code)?.length, 6);
});

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}