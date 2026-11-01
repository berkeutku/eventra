"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { toggleFavoriteAction } from "@/lib/favorite-actions";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export default function FavoriteButton({
  eventId,
  initial,
  loggedIn,
}: {
  eventId: string;
  initial: boolean;
  loggedIn: boolean;
}) {
  const toast = useToast();
  const [favorite, setFavorite] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <Link
        href={`/giris?next=/events/${eventId}`}
        className={`${base} border-line text-ink hover:bg-lilac`}
      >
        <span aria-hidden="true">♡</span>
        Favorilere eklemek için giriş yap
      </Link>
    );
  }

  function handleClick() {
    const want = !favorite;

    startTransition(async () => {
      const result = await toggleFavoriteAction(eventId, want);

      if (result.ok) {
        setFavorite(result.favorited);
        toast.show(
          result.favorited ? "Favorilere eklendi." : "Favorilerden çıkarıldı.",
        );
      } else {
        toast.show(result.message, "info");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={favorite}
      className={`${base} ${
        favorite
          ? "border-violet bg-lilac text-violet"
          : "border-line text-ink hover:bg-lilac"
      }`}
    >
      <span aria-hidden="true">{favorite ? "♥" : "♡"}</span>
      {favorite ? "Favorilerde" : "Favorilere ekle"}
    </button>
  );
}