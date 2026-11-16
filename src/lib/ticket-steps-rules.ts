// Saf kurallar: veritabanı içermez, hem tarayıcı bileşeninden hem test betiğinden içe aktarılabilir.

export type StepState = "done" | "current" | "upcoming";

export type TicketStep = {
  key: "login" | "code" | "ready";
  label: string;
  hint: string;
  state: StepState;
};

// Doğrulama sürerken gösterilen simüle adımlar (gerçek bir servis çağrısı değildir).
export const CHECK_PHASES = [
  "Kod biçimi kontrol ediliyor",
  "Sağlama karakteri doğrulanıyor",
  "Doğrulama kaydediliyor",
] as const;

// Üç adım: giriş, bilet kodu, hazır. Aynı anda en fazla bir adım "current" olur.
export function ticketSteps(loggedIn: boolean, verified: boolean): TicketStep[] {
  // Giriş yapmamış biri doğrulanmış sayılmaz.
  const isVerified = loggedIn && verified;

  const login: StepState = loggedIn ? "done" : "current";
  const code: StepState = isVerified ? "done" : loggedIn ? "current" : "upcoming";
  const ready: StepState = isVerified ? "done" : "upcoming";

  return [
    { key: "login", label: "Giriş yap", hint: "Hesabınla oturum aç", state: login },
    {
      key: "code",
      label: "Bilet kodunu gir",
      hint: "Gerçek kodun yoksa örnek kod üret",
      state: code,
    },
    {
      key: "ready",
      label: "Yolculuğa hazırsın",
      hint: "Yolculuk oluştur ya da katıl",
      state: ready,
    },
  ];
}
