"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import Icon from "@/components/Icons";
import { pickEventImage } from "@/data/event-images";

const DEVICE_W = 324;
const DEVICE_H = 664;
const SCREEN_W = 300;
const SCREEN_H = 640;

const PHOTOS = [
  "/hero/konser.jpg",
  "/hero/cikis.jpg",
  "/hero/arac.jpg",
  "/hero/eve.jpg",
];

type Stage = 0 | 1 | 2 | 3;
type Tap = 0 | 1 | 2 | 3;

const beats = [
  {
    hand: "sonra yolunu bul",
    title: "Yolculuğunu bul",
    text: "Aynı etkinliğe gidenlerin yolculuklarını gör: saat, buluşma noktası ve tahmini masraf tek ekranda.",
  },
  {
    hand: "tek dokunuşla",
    title: "Koltuğunu ayır",
    text: "Sana uygun yolculuğa katıl. Koltuk sayısı ve masraf paylaşımı baştan belli.",
  },
  {
    hand: "ve birlikte dön",
    title: "Eve birlikte var",
    text: "Aynı yöne dönenlerle yola çık. Demo sürümde ödeme alınmaz, tutarlar tahminidir.",
  },
];

const TAPS: Record<1 | 2 | 3, { x: number; y: number }> = {
  1: { x: 150, y: 300 },
  2: { x: 236, y: 392 },
  3: { x: 150, y: 602 },
};

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function layer(active: boolean): string {
  return `col-start-1 row-start-1 self-center transition-all duration-500 motion-reduce:transition-none ${
    active
      ? "translate-y-0 opacity-100"
      : "pointer-events-none translate-y-4 opacity-0"
  }`;
}

function StatusBar({ light }: { light: boolean }) {
  return (
    <div
      className={`absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between px-7 text-xs font-bold transition-colors duration-500 ${
        light ? "text-white" : "text-ink"
      }`}
    >
      <span>21:47</span>
      <span className="flex items-center gap-1.5">
        <span className="flex items-end gap-0.5">
          <span className="block h-1 w-0.5 rounded-sm bg-current" />
          <span className="block h-1.5 w-0.5 rounded-sm bg-current" />
          <span className="block h-2 w-0.5 rounded-sm bg-current" />
          <span className="block h-2.5 w-0.5 rounded-sm bg-current" />
        </span>
        <span className="relative block h-3 w-6 rounded-[4px] border border-current">
          <span className="absolute inset-0.5 w-3/4 rounded-[2px] bg-current" />
        </span>
      </span>
    </div>
  );
}

function Tapper({ show, x, y }: { show: boolean; x: number; y: number }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-50 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/30 ring-2 ring-white/70 transition-all duration-300 motion-reduce:transition-none ${
        show ? "scale-100 opacity-100" : "scale-50 opacity-0"
      }`}
      style={{ left: x, top: y }}
    >
      <span className="h-3.5 w-3.5 rounded-full bg-white/90" />
    </span>
  );
}

function Cover({
  src,
  className,
  children,
}: {
  src?: string;
  className: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-linear-to-br from-[#2a1a6e] via-violet to-coral ${className}`}
    >
      {src ? (
        <Image src={src} alt="" fill sizes="300px" className="object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent" />
      {children}
    </div>
  );
}

function ScreenList({
  stage,
  cover1,
  cover2,
}: {
  stage: Stage;
  cover1?: string;
  cover2?: string;
}) {
  const tabs = [
    { icon: "home" as const, label: "Ana sayfa", active: false },
    { icon: "ticket" as const, label: "Etkinlikler", active: true },
    { icon: "user" as const, label: "Profil", active: false },
  ];

  return (
    <div
      className={`absolute inset-0 bg-surface pt-11 transition-all duration-500 motion-reduce:transition-none ${
        stage === 0 ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-1">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet text-sm font-extrabold text-white">
            e
          </span>
          <span className="text-base font-extrabold tracking-tight text-ink">
            eventra
          </span>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-lilac text-xs font-extrabold text-violet">
          B
        </span>
      </div>

      <p className="mt-3 px-4 text-lg font-extrabold leading-tight text-ink">
        Bugün hangi etkinliğe gidiyoruz?
      </p>

      <div className="mx-4 mt-3 flex h-10 items-center rounded-full bg-white px-4 text-sm text-muted ring-1 ring-black/10">
        Etkinlik ara
      </div>

      <div className="mt-3 flex gap-2 px-4 text-xs font-bold">
        <span className="rounded-full bg-night px-3 py-1.5 text-white">Tümü</span>
        <span className="rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-black/10">
          Konser
        </span>
        <span className="rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-black/10">
          Tiyatro
        </span>
        <span className="rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-black/10">
          Stand-up
        </span>
      </div>

      <div className="mx-4 mt-3 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        <Cover src={cover1} className="h-24">
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink">
            Konser
          </span>
          <span className="absolute right-3 top-3 -rotate-2 rounded-md bg-sun px-2 py-0.5 text-[11px] font-bold text-[#412402]">
            Demo etkinlik
          </span>
        </Cover>
        <div className="flex gap-3 p-3">
          <div className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-lilac text-violet">
            <span className="text-lg font-extrabold leading-none">21</span>
            <span className="text-[11px] font-bold">Kas</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight text-ink">
              Gece Yolculuğu Konseri
            </p>
            <p className="mt-1 text-xs text-muted">
              Liman Sahnesi, İstanbul · 21:00
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        <Cover src={cover2} className="h-20">
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink">
            Stand-up
          </span>
        </Cover>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-16 items-start justify-around border-t border-black/5 bg-white/95 pt-2.5">
        {tabs.map((tab) => (
          <span
            key={tab.label}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
              tab.active ? "text-violet" : "text-muted"
            }`}
          >
            <Icon name={tab.icon} className="h-5 w-5" />
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RideRow({
  to,
  time,
  seats,
  price,
  primary,
}: {
  to: string;
  time: string;
  seats: number;
  price: number;
  primary: boolean;
}) {
  return (
    <div className="mx-4 mt-2.5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-extrabold text-ink">
            Liman Sahnesi → {to}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {time} · {seats} boş koltuk
          </p>
        </div>
        <p className="text-sm font-extrabold text-violet">~{price} TL</p>
      </div>
      <div className="mt-2 flex justify-end">
        <span
          className={`inline-flex h-8 items-center rounded-full px-5 text-xs font-bold ${
            primary
              ? "bg-violet text-white"
              : "bg-white text-violet ring-1 ring-violet/30"
          }`}
        >
          Katıl
        </span>
      </div>
    </div>
  );
}

function ScreenDetail({ stage, cover1 }: { stage: Stage; cover1?: string }) {
  const position =
    stage === 1
      ? "translate-x-0 opacity-100"
      : stage < 1
        ? "translate-x-full opacity-0"
        : "-translate-x-6 opacity-0";

  return (
    <div
      className={`absolute inset-0 bg-surface transition-all duration-500 motion-reduce:transition-none ${position}`}
    >
      <Cover src={cover1} className="h-40">
        <span className="absolute left-4 top-12 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-sm font-bold text-white">
          ←
        </span>
        <div className="absolute inset-x-4 bottom-3 text-white">
          <span className="inline-block rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-ink">
            Konser
          </span>
          <p className="mt-1 text-lg font-extrabold leading-tight">
            Gece Yolculuğu Konseri
          </p>
        </div>
      </Cover>

      <div className="mt-2.5 flex flex-col gap-1 px-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Icon name="pin" className="h-3.5 w-3.5" />
          Liman Sahnesi, İstanbul
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="clock" className="h-3.5 w-3.5" />
          21 Kas · 21:00
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2 px-4">
        {[
          ["Açık yolculuk", "3"],
          ["Boş koltuk", "5"],
          ["En düşük", "~95 TL"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-2 text-center ring-1 ring-black/5"
          >
            <p className="text-[11px] text-muted">{label}</p>
            <p className="text-sm font-extrabold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 px-4 text-sm font-extrabold text-ink">
        Ortak yolculuklar
      </p>
      <RideRow to="Kadıköy" time="23:30" seats={3} price={120} primary />
      <RideRow to="Beşiktaş" time="23:45" seats={2} price={95} primary={false} />
    </div>
  );
}

const PEOPLE = [
  { letter: "A", color: "#ff6b6b" },
  { letter: "B", color: "#00d5a0" },
  { letter: "C", color: "#ffb547" },
  { letter: "Sen", color: "#6c4dff" },
];

function ScreenJoined({ stage }: { stage: Stage }) {
  const position =
    stage === 2
      ? "translate-x-0 opacity-100"
      : stage < 2
        ? "translate-x-full opacity-0"
        : "-translate-x-6 opacity-0";

  return (
    <div
      className={`absolute inset-0 bg-surface pt-11 transition-all duration-500 motion-reduce:transition-none ${position}`}
    >
      <p className="px-4 pt-1 text-lg font-extrabold text-ink">Yolculuğun</p>

      <div className="mx-4 mt-2.5 flex items-center gap-2 rounded-2xl bg-sea px-3 py-2 text-xs font-bold text-mint-ink">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-night">
          <Icon name="check" className="h-3 w-3" />
        </span>
        Koltuğun ayrıldı
      </div>

      <div className="mx-4 mt-2.5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-violet" />
            <span className="h-7 border-l-2 border-dashed border-violet/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-coral" />
          </div>
          <div className="text-[13px]">
            <p className="font-extrabold text-ink">Liman Sahnesi · 23:30</p>
            <p className="mt-5 font-extrabold text-ink">Kadıköy · 00:10</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          Buluşma: Giriş kapısı B · Kişi başı ~120 TL (tahmini)
        </p>
      </div>

      <div className="mx-4 mt-2.5 flex items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        {PEOPLE.map((person, index) => (
          <span
            key={person.letter}
            className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-extrabold text-white transition-all duration-500 motion-reduce:transition-none ${
              stage === 2 ? "scale-100 opacity-100" : "scale-50 opacity-0"
            } ${person.letter === "Sen" ? "ring-2 ring-night" : ""}`}
            style={{
              backgroundColor: person.color,
              transitionDelay: stage === 2 ? `${200 + index * 120}ms` : "0ms",
            }}
          >
            {person.letter}
          </span>
        ))}
        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-dashed border-violet/30 text-xs text-violet/50">
          +
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex h-11 items-center justify-center rounded-full bg-violet text-sm font-bold text-white">
        Yola çık
      </div>
    </div>
  );
}

function ScreenArrived({ stage }: { stage: Stage }) {
  return (
    <div
      className={`absolute inset-0 bg-surface pt-11 transition-all duration-500 motion-reduce:transition-none ${
        stage === 3 ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="mt-10 flex flex-col items-center px-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-mint text-night">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <p className="mt-4 text-xl font-extrabold text-ink">Eve vardın</p>
        <p className="mt-1 text-sm text-muted">Yolculuk tamamlandı.</p>
      </div>

      <div className="mx-4 mt-6 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        <p className="text-[13px] font-extrabold text-ink">
          Liman Sahnesi → Kadıköy
        </p>
        <p className="mt-1 text-xs text-muted">23:30 – 00:10 · 4 kişi</p>
        <p className="mt-2 text-sm font-extrabold text-violet">
          Kişi başı ~120 TL (tahmini)
        </p>
      </div>

      <div className="mx-4 mt-2.5 flex items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        {PEOPLE.map((person) => (
          <span
            key={person.letter}
            className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-extrabold text-white"
            style={{ backgroundColor: person.color }}
          >
            {person.letter}
          </span>
        ))}
      </div>

      <p className="mx-4 mt-3 text-xs text-muted">
        Masraf tahminidir, ödeme alınmaz. Tasarruf özetin profilinde güncellenir.
      </p>
    </div>
  );
}

export default function HeroScroller() {
  const user = useAuthUser();
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>(0);
  const [tap, setTap] = useState<Tap>(0);
  const [failed, setFailed] = useState<boolean[]>([false, false, false, false]);

  const cover1 = pickEventImage("concert", "gece-yolculugu-konseri")?.src;
  const cover2 = pickEventImage("standup", "stand-up-gecesi")?.src;

  useEffect(() => {
    const section = sectionRef.current;
    const slot = slotRef.current;

    if (!section || !slot) {
      return;
    }

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function measure() {
      const r = slot!.getBoundingClientRect();
      const ps = Math.min(r.height / DEVICE_H, r.width / DEVICE_W, 1.15) || 0.6;
      section!.style.setProperty("--ps", ps.toFixed(4));
    }

    function update() {
      frame = 0;
      let p = 0;

      if (!reducedQuery.matches) {
        const rect = section!.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        p = total > 0 ? clamp(-rect.top / total) : 0;
      }

      section!.style.setProperty("--p", p.toFixed(4));
      setStage(p < 0.18 ? 0 : p < 0.45 ? 1 : p < 0.72 ? 2 : 3);
      setTap(
        p >= 0.12 && p < 0.18
          ? 1
          : p >= 0.39 && p < 0.45
            ? 2
            : p >= 0.66 && p < 0.72
              ? 3
              : 0,
      );
    }

    function schedule() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    measure();
    update();

    const observer = new ResizeObserver(() => {
      measure();
      schedule();
    });

    observer.observe(slot);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      observer.disconnect();

      if (frame) {
        cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const primary =
    "inline-flex items-center gap-2 rounded-full bg-violet px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-sky";
  const secondary =
    "rounded-full bg-white/10 px-7 py-3.5 text-base font-bold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/20";

  return (
    <section
      ref={sectionRef}
      aria-label="Eventra tanıtımı"
      className="relative h-[340vh] overflow-clip rounded-b-[2rem] bg-[#14102e] motion-reduce:h-auto sm:rounded-b-[3rem] lg:h-[400vh]"
    >
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-svh">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #14102e 0%, #2b1d6e 60%, #4a35c9 100%)",
          }}
        />

        <div aria-hidden="true" className="absolute inset-0">
          {PHOTOS.map((src, index) =>
            failed[index] ? null : (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-[1100ms] motion-reduce:transition-none ${
                  stage === index ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform:
                    "translateY(calc(var(--p, 0) * -28px)) scale(calc(1.06 + var(--p, 0) * 0.08))",
                  willChange: "transform",
                }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  quality={70}
                  className="object-cover"
                  onError={() =>
                    setFailed((current) =>
                      current.map((value, i) => (i === index ? true : value)),
                    )
                  }
                />
              </div>
            ),
          )}
          <div className="absolute inset-0 bg-linear-to-b from-[#0a081e]/80 via-[#0a081e]/40 to-[#0a081e]/80 lg:hidden" />
          <div className="absolute inset-0 hidden bg-linear-to-r from-[#0a081e]/90 via-[#0a081e]/55 to-[#0a081e]/20 lg:block" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 40%, transparent 45%, rgba(5,4,15,0.55) 100%)",
            }}
          />
        </div>

        <p className="sr-only">
          Çizim: Eventra uygulamasında bir etkinlik seçilir, ortak yolculuğa
          katılınır ve yolcular geceleyin eve birlikte döner. Arka plandaki
          fotoğraflar temsilidir.
        </p>

        <div className="relative mx-auto grid h-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-3 px-5 pb-8 pt-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-1 lg:items-center lg:gap-10 lg:pb-10 lg:pt-20 motion-reduce:h-auto">
          <div className="relative z-20">
            <div className="grid">
              <div className={layer(stage === 0)} inert={stage !== 0}>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/25 backdrop-blur">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mint" />
                  Etkinlik sonrası ortak yolculuk
                </p>
                <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Etkinlik bitti, <span className="text-gradient">yolculuk başlasın!</span>
                </h1>
                <p className="mt-3 hidden -rotate-1 font-hand text-4xl text-[#ff9d9d] sm:inline-block">
                  Aynı etkinlikteyiz, aynı yoldayız.
                </p>
                <p className="mt-3 hidden max-w-md text-base text-white/85 sm:block">
                  Konser çıkışı taksi kuyruğu, derbi sonrası otopark trafiği,
                  gece yarısı dolu duraklar. Eventra, aynı etkinlikten aynı yöne
                  dönenleri buluşturur.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href="/events" className={primary}>
                    Etkinlikleri Keşfet
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                  <a href="#nasil-calisir" className={secondary}>
                    Nasıl çalışır?
                  </a>
                </div>
              </div>

              {beats.map((item, index) => {
                const active = stage === index + 1;

                return (
                  <div
                    key={item.title}
                    className={layer(active)}
                    aria-hidden={!active}
                    inert={!active}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet text-xl font-extrabold text-white sm:h-12 sm:w-12">
                      {index + 1}
                    </span>
                    <p className="mt-2 font-hand text-3xl text-[#ff9d9d]">{item.hand}</p>
                    <h2 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                      {item.title}
                    </h2>
                    <p className="mt-2 max-w-md text-base text-white/85">{item.text}</p>

                    {index === 2 && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link href="/events" className={primary}>
                          Etkinlikleri Keşfet
                          <Icon name="arrow" className="h-4 w-4" />
                        </Link>
                        {!user && (
                          <Link href="/kayit" className={secondary}>
                            Hesap oluştur
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div aria-hidden="true" className="mt-5 hidden items-center gap-2 lg:flex">
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                    stage === dot ? "w-8 bg-white" : "w-1.5 bg-white/35"
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            ref={slotRef}
            className="relative z-10 flex min-h-0 items-center justify-center motion-reduce:min-h-[34rem]"
          >
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/40 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="relative"
              style={{
                width: `calc(${DEVICE_W}px * var(--ps, 0.7))`,
                height: `calc(${DEVICE_H}px * var(--ps, 0.7))`,
                perspective: "1800px",
              }}
            >
              <div className="absolute inset-x-[10%] -bottom-4 h-8 rounded-full bg-black/60 blur-xl" />
              <div
                className="absolute inset-0"
                style={{
                  transform:
                    "rotateY(calc(-9deg + var(--p, 0) * 12deg)) rotateX(3deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="absolute left-0 top-0"
                  style={{
                    width: DEVICE_W,
                    height: DEVICE_H,
                    transform: "scale(var(--ps, 0.7))",
                    transformOrigin: "top left",
                    borderRadius: 52,
                    background:
                      "linear-gradient(145deg, #62626b 0%, #1d1d22 38%, #3b3b43 70%, #17171b 100%)",
                    boxShadow:
                      "0 40px 80px -24px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.14)",
                  }}
                >
                  <span className="absolute -left-[3px] top-24 h-7 w-[3px] rounded-l bg-[#3b3b43]" />
                  <span className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l bg-[#3b3b43]" />
                  <span className="absolute -left-[3px] top-[200px] h-12 w-[3px] rounded-l bg-[#3b3b43]" />
                  <span className="absolute -right-[3px] top-40 h-16 w-[3px] rounded-r bg-[#3b3b43]" />
                  <div className="absolute inset-[3px] rounded-[49px] bg-[#050507]" />

                  <div
                    className="absolute left-3 top-3 overflow-hidden rounded-[40px] bg-surface"
                    style={{ width: SCREEN_W, height: SCREEN_H }}
                  >
                    <StatusBar light={stage === 1} />
                    <ScreenList stage={stage} cover1={cover1} cover2={cover2} />
                    <ScreenDetail stage={stage} cover1={cover1} />
                    <ScreenJoined stage={stage} />
                    <ScreenArrived stage={stage} />
                    <Tapper show={tap === 1} x={TAPS[1].x} y={TAPS[1].y} />
                    <Tapper show={tap === 2} x={TAPS[2].x} y={TAPS[2].y} />
                    <Tapper show={tap === 3} x={TAPS[3].x} y={TAPS[3].y} />
                    <span className="absolute left-1/2 top-2.5 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
                    <span
                      className="pointer-events-none absolute inset-0 z-40"
                      style={{
                        backgroundImage:
                          "linear-gradient(115deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 30%)",
                      }}
                    />
                    <span className="absolute bottom-1.5 left-1/2 z-40 h-1 w-24 -translate-x-1/2 rounded-full bg-black/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="absolute bottom-3 left-5 z-20 text-[11px] text-white/60 sm:left-6">
          Temsili fotoğraflar · ekranlar örnektir (demo)
        </p>
      </div>
    </section>
  );
}