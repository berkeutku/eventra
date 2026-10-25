import { randomInt } from "node:crypto";

// DEMO: Burası gerçek bir bilet sağlayıcısı DEĞİLDİR.
// Dışarıdaki bir bilet servisini taklit eder. Kod yalnızca biçim ve sağlama
// karakteri açısından kontrol edilir. Gerçek bir servis bağlanırsa uygulamanın
// geri kalanı değişmeden yalnızca bu dosya değiştirilir.

// Karıştırılan karakterler (0, 1, I, O) alfabede yok.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PREFIX = "EVT";
const SIMULATED_LATENCY_MS = 700;

export type TicketCheck =
  | { status: "valid"; normalized: string }
  | { status: "malformed" }
  | { status: "rejected" };

// Sağlama karakteri: ilk 5 karakterin sıra ağırlıklı toplamı (mod 32).
function checkChar(five: string): string {
  let sum = 0;

  for (let i = 0; i < five.length; i++) {
    sum += (ALPHABET.indexOf(five[i]) + 1) * (i + 1);
  }

  return ALPHABET[sum % ALPHABET.length];
}

// "evt 7kq-m2x" gibi girdileri "7KQM2X" biçimine getirir, geçersizse null döner.
export function normalizeTicketCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "");

  if (!cleaned.startsWith(PREFIX)) {
    return null;
  }

  const body = cleaned.slice(PREFIX.length);

  if (body.length !== 6) {
    return null;
  }

  for (const character of body) {
    if (!ALPHABET.includes(character)) {
      return null;
    }
  }

  return body;
}

export function validateTicketCode(input: string): TicketCheck {
  const body = normalizeTicketCode(input);

  if (!body) {
    return { status: "malformed" };
  }

  if (checkChar(body.slice(0, 5)) !== body[5]) {
    return { status: "rejected" };
  }

  return { status: "valid", normalized: body };
}

export function generateDemoTicketCode(): string {
  let five = "";

  for (let i = 0; i < 5; i++) {
    five += ALPHABET[randomInt(ALPHABET.length)];
  }

  const body = five + checkChar(five);
  return `${PREFIX}-${body.slice(0, 3)}-${body.slice(3)}`;
}

// Dış servise yapılan ağ çağrısını taklit eder (yapay gecikmeli).
export async function checkTicket(input: string): Promise<TicketCheck> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  return validateTicketCode(input);
}