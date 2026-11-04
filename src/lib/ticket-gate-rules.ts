// Saf kurallar: veritabanı içermez, bu yüzden hem tarayıcı bileşenlerinden hem betiklerden içe aktarılabilir.

export type GateEvent = { source?: "demo" | "biletimgo" };

// ok: işlem serbest, verify_required: önce bilet doğrulanmalı,
// unavailable: bu etkinlik türü için bilet doğrulaması henüz mümkün değil.
export type TicketGate = "ok" | "verify_required" | "unavailable";

export function gateFor(event: GateEvent, verified: boolean): TicketGate {
  // Gerçek (biletimGO) etkinliklerde gerçek bilet doğrulaması yoktur, bu yüzden yolculuk kapalıdır.
  if (event.source === "biletimgo") {
    return "unavailable";
  }

  return verified ? "ok" : "verify_required";
}

export const gateMessages: Record<
  "create" | "join",
  Record<"verify_required" | "unavailable", string>
> = {
  create: {
    verify_required:
      "Yolculuk oluşturmak için önce bu etkinliğin biletini doğrulamalısın. Etkinlik sayfasındaki bilet doğrulama bölümüne bilet kodunu (PNR) gir.",
    unavailable:
      "Gerçek etkinliklerde yolculuk, gerçek bilet (PNR) doğrulaması hazır olduğunda açılacak.",
  },
  join: {
    verify_required:
      "Yolculuğa katılmak için önce bu etkinliğin biletini doğrulamalısın. Etkinlik sayfasındaki bilet doğrulama bölümüne bilet kodunu (PNR) gir.",
    unavailable:
      "Gerçek etkinliklerde yolculuğa katılma, gerçek bilet (PNR) doğrulaması hazır olduğunda açılacak.",
  },
};