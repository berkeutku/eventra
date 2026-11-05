import { cleanText } from "./rating-rules";

// Saf kurallar: veritabanı içermez, hem sunucuda hem tarayıcıda ve betiklerde kullanılabilir.

export const MAX_DESTINATION = 80;
export const MAX_NOTE = 140;
export const MAX_REQUESTS_PER_DAY = 5;
export const MAX_REQUEST_SEATS = 4;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const WHOLE_NUMBER = /^\d+$/;

export type RequestField = "destination" | "preferredTime" | "seats" | "note";

export type RequestFields = {
  destination: string;
  preferredTime: string | null;
  seats: number;
  note: string | null;
};

export type RequestParse =
  | { ok: true; value: RequestFields }
  | { ok: false; errors: Partial<Record<RequestField, string>> };

// Telefon numarası, e-posta ya da bağlantı gibi iletişim bilgisi içeriyor mu?
export function looksLikeContact(text: string): boolean {
  return (
    /(?:\d[\s\-.()]*){10,}/.test(text) ||
    text.includes("@") ||
    /https?:|www\./i.test(text)
  );
}

export function parseRequestInput(
  input: Record<RequestField, string>,
): RequestParse {
  const errors: Partial<Record<RequestField, string>> = {};

  const destination = cleanText(input.destination, MAX_DESTINATION);
  const note = cleanText(input.note, MAX_NOTE);
  const timeText = input.preferredTime.trim();
  const seatsText = input.seats.trim();

  if (destination.length < 2) {
    errors.destination = "Varış yeri en az 2 karakter olmalı.";
  } else if (looksLikeContact(destination)) {
    errors.destination =
      "Varış yerine telefon, e-posta ya da bağlantı yazma, yalnızca yer adı yaz.";
  }

  if (timeText !== "" && !TIME_PATTERN.test(timeText)) {
    errors.preferredTime = "Saat geçerli değil.";
  }

  const seats = WHOLE_NUMBER.test(seatsText) ? Number(seatsText) : null;

  if (seats === null || seats < 1 || seats > MAX_REQUEST_SEATS) {
    errors.seats = `Kişi sayısı 1 ile ${MAX_REQUEST_SEATS} arasında olmalı.`;
  }

  if (note && looksLikeContact(note)) {
    errors.note =
      "Nota telefon, e-posta ya da bağlantı yazma. İletişim yolculuk oluşturulduktan sonra kurulur.";
  }

  if (Object.keys(errors).length > 0 || seats === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      destination,
      preferredTime: timeText === "" ? null : timeText,
      seats,
      note: note === "" ? null : note,
    },
  };
}

// Yalnızca ilk ad gösterilir (gizlilik).
export function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first ? first.slice(0, 20) : "Yolcu";
}

export const requestGateMessages: Record<
  "verify_required" | "unavailable",
  string
> = {
  verify_required:
    "Yolcu talebi oluşturmak için önce bu etkinliğin biletini doğrulamalısın. Etkinlik sayfasındaki bilet doğrulama bölümüne bilet kodunu (PNR) gir.",
  unavailable:
    "Gerçek etkinliklerde yolcu talebi, gerçek bilet (PNR) doğrulaması hazır olduğunda açılacak.",
};