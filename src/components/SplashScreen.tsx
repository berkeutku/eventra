"use client";

import Image from "next/image";
import { SPLASH_ATTRIBUTE } from "@/lib/splash-rules";

// Web ve PWA açılışında oturum başına bir kez, 3 saniyelik açılış görseli.
// Görünürlüğü <html data-splash="1"> işaretine bağlıdır (bkz. layout.tsx ve globals.css);
// işaret yoksa görsel hiç gösterilmez ve sayfa hemen kullanılabilir.
export default function SplashScreen() {
  function skip() {
    document.documentElement.removeAttribute(SPLASH_ATTRIBUTE);
  }

  return (
    <div
      id="eventra-splash"
      aria-hidden="true"
      onClick={skip}
      className="fixed inset-0 z-[100] flex-col items-center justify-center overflow-hidden bg-[#090923] text-white"
    >
      <div className="splash-spotlight pointer-events-none absolute inset-0" />
      <div className="splash-glow pointer-events-none absolute bottom-[-18%] left-1/2 h-[55%] w-[120%] -translate-x-1/2 rounded-full bg-violet/40 blur-3xl" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <Image
          src="/logo-mark.png"
          alt=""
          width={366}
          height={272}
          className="splash-logo h-24 w-auto drop-shadow-[0_0_36px_rgba(108,77,255,0.65)] sm:h-32"
        />
        <p className="splash-word mt-8 text-3xl font-extrabold uppercase tracking-[0.45em] sm:text-4xl">
          Eventra
        </p>
        <p className="splash-tag mt-3 font-hand text-2xl text-coral sm:text-3xl">
          Your Event. Your Route.
        </p>
      </div>

      <div className="absolute inset-x-10 bottom-14 mx-auto h-1 max-w-xs overflow-hidden rounded-full bg-white/15">
        <span className="splash-bar block h-full origin-left rounded-full bg-linear-to-r from-violet via-coral to-mint" />
      </div>
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-5 right-5 rounded-full px-4 py-2 text-xs font-bold text-white/70 hover:text-white"
      >
        Geç
      </button>
    </div>
  );
}
