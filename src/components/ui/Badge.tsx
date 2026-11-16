import type { ReactNode } from "react";

// Ortak rozet stilleri: "Demo", durum ve kategori etiketleri için.

export type BadgeTone = "sun" | "violet" | "mint" | "neutral";

const tones: Record<BadgeTone, string> = {
  sun: "bg-sun/30 text-ink",
  violet: "bg-lilac text-violet",
  mint: "bg-sea text-mint-ink",
  neutral: "bg-surface text-muted",
};

export function badgeClass(tone: BadgeTone = "neutral", extra = ""): string {
  return [
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider",
    tones[tone],
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return <span className={badgeClass(tone, className)}>{children}</span>;
}
