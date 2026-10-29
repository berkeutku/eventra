"use client";

import Image from "next/image";
import { useState } from "react";
import EventArt from "@/components/EventArt";
import type { EventCategory } from "@/data/events";

// Fotoğraf yoksa ya da yüklenemezse çizimli görsele döner.
export default function EventCover({
  category,
  src,
  sizes,
  priority = false,
  className,
}: {
  category: EventCategory;
  src?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
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