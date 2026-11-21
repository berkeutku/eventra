import {
  genderLabels,
  policyLabels,
  type Gender,
  type RidePolicy,
} from "@/lib/gender-rules";

// Küçük rozet: kullanıcının kendi beyan ettiği cinsiyet. Cinsiyet yoksa hiçbir şey göstermez.
export function GenderChip({
  gender,
  className = "",
}: {
  gender?: Gender | null;
  className?: string;
}) {
  if (!gender) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-lilac px-2.5 py-0.5 text-xs font-bold text-violet ${className}`}
    >
      {genderLabels[gender]}
    </span>
  );
}

// "Sadece kadınlar" / "Sadece erkekler" yolculuk rozeti. Karma yolculukta gösterilmez.
export function PolicyBadge({
  policy,
  className = "",
}: {
  policy?: RidePolicy;
  className?: string;
}) {
  if (!policy || policy === "mixed") {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-peach px-3 py-1 text-xs font-bold text-coral-ink ${className}`}
    >
      {policyLabels[policy]}
    </span>
  );
}
