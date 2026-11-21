// Cinsiyet ve yolculuk türü kuralları. Veritabanı içermez; hem uygulamadan hem test betiğinden
// çağrıldığı için başka dosyalardan içe aktarma yapmaz.
//
// Önemli: cinsiyet kullanıcının kendi beyanıdır. Eventra bunu kimlikle doğrulamaz.

export type Gender = "female" | "male";
export type RidePolicy = "mixed" | "women_only" | "men_only";

export const GENDER_FIELD = "gender";
export const RIDE_POLICY_FIELD = "ridePolicy";

export const GENDERS: Gender[] = ["female", "male"];
export const RIDE_POLICIES: RidePolicy[] = ["mixed", "women_only", "men_only"];

export const genderLabels: Record<Gender, string> = {
  female: "Kadın",
  male: "Erkek",
};

export const policyLabels: Record<RidePolicy, string> = {
  mixed: "Karma yolculuk",
  women_only: "Sadece kadınlar",
  men_only: "Sadece erkekler",
};

export const policyHints: Record<RidePolicy, string> = {
  mixed: "Herkes katılabilir.",
  women_only: "Sürücü kadın, yalnızca kadın yolcular katılabilir.",
  men_only: "Sürücü erkek, yalnızca erkek yolcular katılabilir.",
};

export const GENDER_SELF_DECLARED_NOTE =
  "Cinsiyet bilgisi kendi beyanına dayanır; Eventra bunu kimlikle doğrulamaz.";

export function parseGender(value: unknown): Gender | null {
  return value === "female" || value === "male" ? value : null;
}

// Alan hiç gönderilmediyse ya da boşsa karma yolculuk sayılır. Geçersiz değer null döner.
export function parseRidePolicy(value: unknown): RidePolicy | null {
  if (value === undefined || value === null || value === "") {
    return "mixed";
  }

  return value === "mixed" || value === "women_only" || value === "men_only"
    ? value
    : null;
}

// Bu yolculuk türüne katılabilmek (ya da bu türde yolculuk açabilmek) için gereken cinsiyet.
export function policyRequiredGender(policy: RidePolicy): Gender | null {
  if (policy === "women_only") return "female";
  if (policy === "men_only") return "male";
  return null;
}

export function policyAllowsGender(
  policy: RidePolicy,
  gender: Gender | null | undefined,
): boolean {
  const required = policyRequiredGender(policy);
  return required === null || gender === required;
}

// Sürücünün yolculuk oluştururken seçebileceği türler. Cinsiyeti belirtilmemişse yalnızca karma.
export function policyOptionsFor(gender: Gender | null | undefined): RidePolicy[] {
  if (gender === "female") return ["mixed", "women_only"];
  if (gender === "male") return ["mixed", "men_only"];
  return ["mixed"];
}

// Sürücü bu türde yolculuk açabilir mi? Açabiliyorsa null, açamıyorsa kullanıcıya gösterilecek mesaj.
export function driverPolicyMessage(
  policy: RidePolicy,
  gender: Gender | null | undefined,
): string | null {
  if (policy === "mixed") return null;

  if (!gender) {
    return "Bu yolculuk türü için önce profilinde cinsiyetini belirtmelisin.";
  }

  if (!policyAllowsGender(policy, gender)) {
    return policy === "women_only"
      ? "Sadece kadınlar yolculuğunu yalnızca kadın sürücüler açabilir."
      : "Sadece erkekler yolculuğunu yalnızca erkek sürücüler açabilir.";
  }

  return null;
}

// Yolcu bu yolculuğa katılabilir mi? Katılabiliyorsa null, katılamıyorsa kullanıcıya gösterilecek mesaj.
export function joinPolicyMessage(
  policy: RidePolicy,
  gender: Gender | null | undefined,
): string | null {
  if (policy === "mixed") return null;

  if (!gender) {
    return "Bu yolculuk cinsiyete göre sınırlı. Katılmak için önce profilinde cinsiyetini belirtmelisin.";
  }

  if (!policyAllowsGender(policy, gender)) {
    return policy === "women_only"
      ? "Bu yolculuk yalnızca kadın yolculara açık."
      : "Bu yolculuk yalnızca erkek yolculara açık.";
  }

  return null;
}

// Cinsiyet yalnızca henüz belirtilmemişse kullanıcı tarafından bir kez ayarlanabilir.
// Sonradan serbestçe değiştirilebilseydi "sadece kadınlar" yolculukları kötüye kullanılabilirdi.
export function genderCanBeSet(current: Gender | null | undefined): boolean {
  return !current;
}
