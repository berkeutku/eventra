import type { ReactNode } from "react";

// Ortak kart stili: beyaz, yuvarlak, hafif gölgeli.
export const cardClass =
  "rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={[cardClass, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
