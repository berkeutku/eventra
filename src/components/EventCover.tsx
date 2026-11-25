"use client";

import Image from "next/image";
import { useState } from "react";
import EventArt from "@/components/EventArt";
import type { EventCategory } from "@/data/events";

// Fotoğraf yoksa ya da yüklenemezse çizimli görsele döner.
// fit="poster": dikey afişler kırpılmasın diye afiş tam görünür, arkası aynı görselin bulanık hali ile dolar.
export default function EventCover({
  category,
  src,
  sizes,
  priority = false,
  className,
  fit = "cover",
}: {
  category: EventCategory;
  src?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "poster";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <EventArt
        category={category}
        className={className ?? "absolute inset-0 h-full w-full"}
      />
    );
  }

  if (fit === "poster") {
    return (
      <>
        <Image
          src={src}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes ?? "100vw"}
          priority={priority}
          className="scale-125 object-cover opacity-80 blur-2xl"
        />
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes ?? "100vw"}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
        />
      </>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes ?? "100vw"}
      priority={priority}
      onError={() => setFailed(true)}
      className="object-cover"
    />
  );
}
