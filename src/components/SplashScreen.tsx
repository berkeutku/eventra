"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SPLASH_ATTRIBUTE } from "@/lib/splash-rules";

// Web ve PWA açılışında oturum başına bir kez gösterilen afiş açılış ekranı.
// Süreli değildir: kullanıcı "Girişe geç" düğmesine basana (ya da Esc'ye) kadar açık kalır.
// Görünürlüğü <html data-splash="1"> işaretine bağlıdır (bkz. layout.tsx ve globals.css).
// Afiş görseli: public/splash/eventra-afis.webp (941x1672). Başlık, afişteki boş panelin
// üstüne yüzde değerleriyle yerleştirilir; görsel değişirse .splash-titlebox değerleri güncellenmeli.

const POSTER = "/splash/eventra-afis.webp";

export default function SplashScreen() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  function close() {
    document.documentElement.removeAttribute(SPLASH_ATTRIBUTE);
  }

  useEffect(() => {
    if (document.documentElement.getAttribute(SPLASH_ATTRIBUTE) !== "1") {
      return;
    }

    buttonRef.current?.focus({ preventScroll: true });

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        document.documentElement.removeAttribute(SPLASH_ATTRIBUTE);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      id="eventra-splash"
      className="splash-root"
      lang="tr"
      role="dialog"
      aria-modal="true"
      aria-label="Eventra karşılama ekranı"
    >
      <Image src={POSTER} alt="" fill priority sizes="100vw" className="splash-backdrop" />

      <div className="splash-poster">
        <Image
          src={POSTER}
          alt=""
          fill
          priority
          sizes="(min-width: 700px) 56vh, 100vw"
          className="splash-poster-img"
        />
        <div className="splash-titlebox">
          <p className="splash-kicker">ŞEHRİN EN UZUN GECESİ</p>
          <h1 className="splash-title">eventra</h1>
          <p className="splash-tagline">your event. your route.</p>
        </div>
      </div>

      <div className="splash-bottom">
        <p className="splash-sub">
          Etkinlik biter, yolculuk başlar. Aynı etkinlikten dönenlerle birlikte
          eve git.
        </p>
        <button ref={buttonRef} type="button" onClick={close} className="splash-cta">
          GİRİŞE GEÇ
        </button>
        <p className="splash-hint">Esc tuşu da kapatır</p>
      </div>
    </div>
  );
}
