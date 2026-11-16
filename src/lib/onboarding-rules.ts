// Saf kurallar: veritabanı içermez, hem sayfadan hem test betiğinden içe aktarılabilir.

export type OnboardingInput = {
  hasFavorite: boolean;
  verifiedCount: number;
  totalRides: number;
  pushEnabled: boolean;
  isDriver: boolean;
  latestVerified: { id: string; title: string } | null;
};

export type OnboardingStep = {
  key: "choose" | "verify" | "ride" | "push";
  text: string;
  done: boolean;
};

export type OnboardingAction = { href: string; label: string };

// Başlarken kartı, ilk yolculuğa kadar görünür.
export function onboardingVisible(input: OnboardingInput): boolean {
  return input.totalRides === 0;
}

export function onboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const hasRide = input.totalRides > 0;
  // Yolculuğu olan biri bileti doğrulamıştır (ürün kuralı), eski kayıtlar için de böyle sayılır.
  const verified = input.verifiedCount > 0 || hasRide;

  return [
    {
      key: "choose",
      text: "Bir etkinlik seç",
      done: input.hasFavorite || verified,
    },
    {
      key: "verify",
      text: "Etkinliğin biletini doğrula (PNR)",
      done: verified,
    },
    {
      key: "ride",
      text: input.isDriver ? "Bir yolculuk oluştur" : "Bir yolculuğa katıl",
      done: hasRide,
    },
    {
      key: "push",
      text: "Telefon bildirimlerini aç (Ayarlar)",
      done: input.pushEnabled,
    },
  ];
}

// Kullanıcıyı bir sonraki mantıklı adıma götüren tek düğme.
export function onboardingAction(input: OnboardingInput): OnboardingAction {
  if (input.verifiedCount === 0) {
    return { href: "/events", label: "Bir etkinlik seç ve bileti doğrula" };
  }

  if (input.totalRides === 0 && input.latestVerified) {
    return {
      href: `/events/${input.latestVerified.id}`,
      label: input.isDriver
        ? "Bu etkinlik için yolculuk oluştur"
        : "Bu etkinlikteki yolculukları gör",
    };
  }

  if (!input.pushEnabled) {
    return { href: "/panel/ayarlar", label: "Bildirimleri aç" };
  }

  return { href: "/events", label: "Etkinliklere göz at" };
}
