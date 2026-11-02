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
    text: "Sana uygun yolculuğa katıl. Koltuklar doldukça yolculuk netleşir, masraf baştan paylaşılır.",
  },
  {
    hand: "ve birlikte dön",
    title: "Eve birlikte var",
    text: "Aynı yöne dönenlerle yola çık. Demo sürümde ödeme alınmaz, tutarlar tahminidir.",
  },
];

const TAPS: Record<1 | 2 | 3, { x: number; y: number }> = {
  1: { x: 150, y: 300 },
  2: { x: 242, y: 388 },
  3: { x: 150, y: 602 },
};

const PEOPLE = [
  { letter: "Sen", color: "#6c4dff" },
  { letter: "A", color: "#ff6b6b" },
  { letter: "B", color: "#00d5a0" },
  { letter: "C", color: "#ffb547" },
];

const CONFETTI = [
  { dx: -64, dy: -48, r: 30, color: "#ff6b6b", round: false },
  { dx: -26, dy: -78, r: -20, color: "#00d5a0", round: true },
  { dx: 30, dy: -70, r: 50, color: "#ffb547", round: false },
  { dx: 72, dy: -38, r: 10, color: "#6c4dff", round: true },
  { dx: -84, dy: 8, r: 80, color: "#6c4dff", round: false },
  { dx: 86, dy: 20, r: -40, color: "#ff6b6b", round: true },
  { dx: -44, dy: 48, r: 20, color: "#ffb547", round: true },
  { dx: 20, dy: 64, r: 70, color: "#00d5a0", round: false },
  { dx: 60, dy: 52, r: -60, color: "#6c4dff", round: false },
];

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
      className={`pointer-events-none absolute z-50 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-violet/25 ring-2 ring-violet/60 transition-all duration-300 motion-reduce:transition-none ${
        show ? "scale-100 opacity-100" : "scale-50 opacity-0"
      }`}
      style={{ left: x, top: y }}
    >
      <span className="h-3.5 w-3.5 rounded-full bg-violet" />
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
      className={`absolute inset-0 bg-surface transition-all duration-500 motion-reduce:transition-none ${
        stage === 0 ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
      }`}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-surface px-4 pb-2 pt-12">
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

      <div className="absolute inset-x-0 bottom-16 top-[92px] overflow-hidden">
        <div style={{ transform: "translateY(calc(var(--ls, 0) * -64px))" }}>
          <p className="px-4 pt-2 text-lg font-extrabold leading-tight text-ink">
            Bugün hangi etkinliğe gidiyoruz?
          </p>

          <div className="mx-4 mt-3 flex h-10 items-center rounded-full bg-white px-4 text-sm text-muted ring-1 ring-black/10">
            Etkinlik ara
          </div>

          <div className="mt-3 flex gap-2 px-4 text-xs font-bold">
            <span className="rounded-full bg-night px-3 py-1.5 text-white">
              Tümü
            </span>
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
            <Cover src={cover2} className="h-24">
              <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink">
                Stand-up
              </span>
            </Cover>
            <div className="p-3">
              <p className="text-sm font-extrabold leading-tight text-ink">
                Kahkaha Gecesi
              </p>
            </div>
          </div>
        </div>
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
  pressed,
}: {
  to: string;
  time: string;
  seats: number;
  price: number;
  primary: boolean;
  pressed: boolean;
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
          className={`inline-flex h-8 items-center rounded-full px-5 text-xs font-bold transition-transform duration-200 ${
            primary
              ? "bg-violet text-white"
              : "bg-white text-violet ring-1 ring-violet/30"
          } ${primary && pressed ? "scale-90" : "scale-100"}`}
        >
          Katıl
        </span>
      </div>
    </div>
  );
}

function ScreenDetail({
  stage,
  tap,
  cover1,
}: {
  stage: Stage;
  tap: Tap;
  cover1?: string;
}) {
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
      <RideRow
        to="Kadıköy"
        time="23:30"
        seats={3}
        price={120}
        primary
        pressed={tap === 2}
      />
      <RideRow
        to="Beşiktaş"
        time="23:45"
        seats={2}
        price={95}
        primary={false}
        pressed={false}
      />
    </div>
  );
}

function ScreenJoined({
  stage,
  tap,
  fill,
}: {
  stage: Stage;
  tap: Tap;
  fill: number;
}) {
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

      <div className="mx-4 mt-2.5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold text-ink">Yolcular</p>
          <p className="text-xs font-bold text-violet">
            {Math.max(1, fill)} / 4 koltuk dolu
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {PEOPLE.map((person, index) => {
            const visible = stage === 2 && index < fill;

            return (
              <span
                key={person.letter}
                className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-extrabold text-white transition-all duration-500 motion-reduce:transition-none ${
                  visible ? "scale-100 opacity-100" : "scale-50 opacity-0"
                } ${person.letter === "Sen" ? "ring-2 ring-night" : ""}`}
                style={{ backgroundColor: person.color }}
              >
                {person.letter}
              </span>
            );
          })}
        </div>
      </div>

      <div
        className={`absolute inset-x-4 bottom-4 flex h-11 items-center justify-center rounded-full text-sm font-bold text-white transition-all duration-200 ${
          tap === 3 ? "scale-95 bg-sky" : "scale-100 bg-violet"
        }`}
      >
        Yola çık
      </div>
    </div>
  );
}

function ScreenArrived({ stage }: { stage: Stage }) {
  const on = stage === 3;

  return (
    <div
      className={`absolute inset-0 bg-surface pt-11 transition-all duration-500 motion-reduce:transition-none ${
        on ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="mt-12 flex flex-col items-center px-6 text-center">
        <div className="relative">
          <span
            className={`grid h-16 w-16 place-items-center rounded-full bg-mint text-night transition-transform duration-500 motion-reduce:transition-none ${
              on ? "scale-100" : "scale-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <Icon name="check" className="h-8 w-8" />
          </span>
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 block"
              style={{
                width: piece.round ? 8 : 12,
                height: piece.round ? 8 : 6,
                marginLeft: piece.round ? -4 : -6,
                marginTop: piece.round ? -4 : -3,
                borderRadius: piece.round ? 999 : 2,
                backgroundColor: piece.color,
                opacity: on ? 1 : 0,
                transform: on
                  ? `translate(${piece.dx}px, ${piece.dy}px) rotate(${piece.r}deg)`
                  : "translate(0px, 0px) scale(0.2)",
                transition: `transform 800ms cubic-bezier(0.2, 0.8, 0.2, 1) ${200 + index * 40}ms, opacity 300ms ${200 + index * 40}ms`,
              }}
            />
          ))}
        </div>
        <p className="mt-5 text-xl font-extrabold text-ink">Eve vardın</p>
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
  const [fill, setFill] = useState(1);

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
      section!.style.setProperty("--ls", clamp(p / 0.1).toFixed(3));

      setStage(p < 0.22 ? 0 : p < 0.45 ? 1 : p < 0.78 ? 2 : 3);
      setTap(
        p >= 0.15 && p < 0.22
          ? 1
          : p >= 0.38 && p < 0.45
            ? 2
            : p >= 0.7 && p < 0.78
              ? 3
              : 0,
      );
      setFill(p < 0.5 ? 1 : p < 0.57 ? 2 : p < 0.64 ? 3 : 4);
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
    "inline-flex items-center gap-2 rounded-full bg-violet px-7 py-3.5 text-base font-bold text-white shadow-soft transition-colors hover:bg-sky";
  const secondary =
    "rounded-full bg-white px-7 py-3.5 text-base font-bold text-violet ring-1 ring-violet/25 transition-colors hover:bg-lilac";

  return (
    <section
      ref={sectionRef}
      aria-label="Eventra tanıtımı"
      className="relative h-[300vh] overflow-clip rounded-b-[2rem] bg-surface motion-reduce:h-auto sm:rounded-b-[3rem] lg:h-[360vh]"
    >
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-svh">
        <div aria-hidden="true" className="absolute inset-0 bg-surface" />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(108,77,255,0.13) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-violet/20 blur-3xl"
          style={{
            transform:
              "translate(calc(var(--p, 0) * 90px), calc(var(--p, 0) * 140px))",
            willChange: "transform",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-coral/20 blur-3xl"
          style={{
            transform:
              "translate(calc(var(--p, 0) * -70px), calc(var(--p, 0) * -110px))",
            willChange: "transform",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-mint/25 blur-3xl"
          style={{
            transform:
              "translate(calc(var(--p, 0) * 60px), calc(var(--p, 0) * -90px))",
            willChange: "transform",
          }}
        />

        <p className="sr-only">
          Çizim: Eventra uygulamasında bir etkinlik seçilir, ortak yolculuğa
          katılınır, koltuklar dolar ve yolculuk eve varışla tamamlanır.
        </p>

        <div className="relative mx-auto grid h-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-3 px-5 pb-8 pt-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-1 lg:items-center lg:gap-10 lg:pb-10 lg:pt-20 motion-reduce:h-auto">
          <div className="relative z-20">
            <div className="grid">
              <div className={layer(stage === 0)} inert={stage !== 0}>
                <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-violet ring-1 ring-black/5">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-mint"
                  />
                  Etkinlik sonrası ortak yolculuk
                </p>
                <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                  Etkinlik bitti,{" "}
                  <span
                    style={{
                      backgroundImage: "linear-gradient(90deg, #6c4dff, #ff6b6b)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    yolculuk başlasın!
                  </span>
                </h1>
                <p className="mt-3 hidden -rotate-1 font-hand text-4xl text-coral-ink sm:inline-block">
                  Aynı etkinlikteyiz, aynı yoldayız.
                </p>
                <p className="mt-3 hidden max-w-md text-base text-muted sm:block">
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
                    <p className="mt-2 font-hand text-3xl text-coral-ink">
                      {item.hand}
                    </p>
                    <h2 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
                      {item.title}
                    </h2>
                    <p className="mt-2 max-w-md text-base text-muted">
                      {item.text}
                    </p>

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

            <div
              aria-hidden="true"
              className="mt-5 hidden items-center gap-2 lg:flex"
            >
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                    stage === dot ? "w-8 bg-violet" : "w-1.5 bg-violet/25"
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
              className="relative"
              style={{
                width: `calc(${DEVICE_W}px * var(--ps, 0.7))`,
                height: `calc(${DEVICE_H}px * var(--ps, 0.7))`,
                perspective: "1800px",
              }}
            >
              <div className="absolute inset-x-[8%] -bottom-5 h-8 rounded-full bg-violet/40 blur-xl" />
              <div
                className="absolute inset-0"
                style={{
                  transform:
                    "translateY(calc(var(--p, 0) * -20px)) rotateY(calc(-9deg + var(--p, 0) * 12deg)) rotateX(3deg)",
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
                      "0 40px 80px -24px rgba(60,40,160,0.55), inset 0 0 0 1px rgba(255,255,255,0.14)",
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
                    <ScreenDetail stage={stage} tap={tap} cover1={cover1} />
                    <ScreenJoined stage={stage} tap={tap} fill={fill} />
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

        <p className="absolute bottom-3 left-5 z-20 text-[11px] text-muted sm:left-6">
          Ekranlar örnektir (demo)
        </p>
      </div>
    </section>
  );
}