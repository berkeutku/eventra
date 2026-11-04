"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapViewProps } from "@/components/MapView";

// Harita kodu yalnızca gerektiğinde yüklenir: sayfa hızı (PageSpeed) etkilenmez.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-72 w-full animate-pulse rounded-2xl bg-lilac"
    />
  ),
});

type Props = MapViewProps & {
  startOpen?: boolean;
  buttonLabel?: string;
};

export default function LazyMap({
  startOpen = false,
  buttonLabel = "Haritayı göster",
  ...mapProps
}: Props) {
  const [open, setOpen] = useState(startOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-lilac"
      >
        {buttonLabel}
      </button>
    );
  }

  return <MapView {...mapProps} />;
}