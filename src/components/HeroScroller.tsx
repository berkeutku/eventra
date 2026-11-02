"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import Icon, { type IconName } from "@/components/Icons";
import {
  DetailScreen,
  EventsScreen,
  RidesScreen,
  StatusBar,
  TabBar,
} from "@/components/PhoneScreens";
import StoryCanvas from "@/components/StoryCanvas";

const PHONE_W = 300;
const PHONE_H = 620;
const JOIN_AT = 0.86;

const paneStyle: CSSProperties = {
  backgroundImage:
    "radial-gradient(60% 55% at 12% 0%, rgba(108,77,255,0.7), transparent 70%), radial-gradient(45% 45% at 95% 25%, rgba(255,107,107,0.45), transparent 70%), radial-gradient(60% 40% at 50% 115%, rgba(0,213,160,0.28), transparent 70%)",
};

function stepFor(progress: number): number {
  if (progress < 0.12) return 0;
  if (progress < 0.4) return 1;
  if (progress < 0.68) return 2;
  return 3;
}

function variantIndex(step: number, joined: boolean): number {
  if (step <= 1) return 0;
  if (step === 2) return 1;
  return joined ? 3 : 2;
}

const storySteps = [
  {
    number: 1,
    hand: "önce bir etkinlik seç",
    title: "Etkinliği seç",
    text: "Konser, derbi veya tiyatro. Katılacağın etkinliği bul ve o etkinliğe giden sürücülerin yolculuklarını gör.",
  },
  {
    number: 2,
    hand: "sonra yolunu bul",
    title: "Yolculuğunu bul",
    text: "Yolculukları kalkış saatine ya da kişi başı masrafa göre sırala, boş koltuğu olanları filtrele.",
  },
  {
    number: 3,
    hand: "ve birlikte dön",
    title: "Birlikte dön",
    text: "Buluşma noktası, kalkış saati ve tahmini masraf tek ekranda. Koltuğunu ayırmak tek dokunuş.",
  },
];

type ChipVariant = { icon: IconName; text: string };

const chipsA: ChipVariant[] = [
  { icon: "check", text: "Aynı etkinlik, aynı yol" },
  { icon: "route", text: "3 yolculuk bulundu" },
  { icon: "pin", text: "Buluşma: Ana kapı önü" },
  { icon: "check", text: "Koltuğun ayrıldı!" },
];

const chipsB: ChipVariant[] = [
  { icon: "ticket", text: "6 örnek etkinlik" },
  { icon: "wallet", text: "En düşük 100 TL" },
  { icon: "users", text: "3 boş koltuk" },
  { icon: "users", text: "2 / 3 koltuk boş" },
];

function layerClass(active: boolean): string {
  return `col-start-1 row-start-1 self-center transition-all duration-500 motion-reduce:transition-none ${
    active
      ? "translate-y-0 opacity-100"
      : "pointer-events-none translate-y-6 opacity-0"
  }`;
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" />
    </svg>
  );
}

export default function HeroScroller() {
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const story = useRef({ progress: 0 });
  const user = useAuthUser();
  const [step, setStep] = useState(0);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) {
      return;
    }

    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let tiltFrame = 0;
    let tiltX = 0;
    let tiltY = 0;

    function update() {
      frame = 0;

      if (!element) {
        return;
      }

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (!desktop.matches) {
        const scale = Math.min(1, (viewportWidth - 48) / PHONE_W);
        element.style.setProperty("--s", scale.toFixed(3));
        element.style.setProperty("--p", "0");
        story.current.progress = 0;
        setStep(0);
        setJoined(false);
        return;
      }

      const scale = Math.min(1, Math.max(0.55, (viewportHeight - 230) / PHONE_H));
      const rect = element.getBoundingClientRect();
      const total = rect.height - viewportHeight;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

      element.style.setProperty("--s", scale.toFixed(3));
      element.style.setProperty("--p", progress.toFixed(4));
      story.current.progress = progress;
      setStep(stepFor(progress));
      setJoined(progress >= JOIN_AT);
    }

    function schedule() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    function applyTilt() {
      tiltFrame = 0;
      element?.style.setProperty("--mx", tiltX.toFixed(3));
      element?.style.setProperty("--my", tiltY.toFixed(3));
    }

    function onPointerMove(event: PointerEvent) {
      if (!desktop.matches || reduced.matches) {
        return;
      }

      tiltX = (event.clientX / window.innerWidth) * 2 - 1;
      tiltY = (event.clientY / window.innerHeight) * 2 - 1;

      if (!tiltFrame) {
        tiltFrame = requestAnimationFrame(applyTilt);
      }
    }

    function onPointerLeave() {
      tiltX = 0;
      tiltY = 0;

      if (!tiltFrame) {
        tiltFrame = requestAnimationFrame(applyTilt);
      }
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    desktop.addEventListener("change", schedule);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerleave", onPointerLeave);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      if (tiltFrame) {
        cancelAnimationFrame(tiltFrame);
      }
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      desktop.removeEventListener("change", schedule);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  const screenIndex = step <= 1 ? 0 : step - 1;
  const chipIndex = variantIndex(step, joined);

  const screens = [
    <EventsScreen key="events" highlight={step === 1} />,
    <RidesScreen key="rides" highlight={step === 2} />,
    <DetailScreen key="detail" joined={joined} />,
  ];

  return (
    <section
      ref={sectionRef}
      aria-label="Eventra tanıtımı"
      className="relative overflow-clip rounded-b-[2.5rem] bg-night text-white sm:rounded-b-[4rem] lg:h-[380vh]"
    >
      <div
        className="relative overflow-clip lg:sticky lg:top-0 lg:h-screen"
        style={paneStyle}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-96 w-96 rounded-full bg-violet/40 blur-3xl"
          style={{
            transform:
              "translate3d(calc(var(--p, 0) * 16vw), calc(var(--p, 0) * 18vh), 0)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-32 h-96 w-96 rounded-full bg-coral/30 blur-3xl"
          style={{
            transform:
              "translate3d(calc(var(--p, 0) * -12vw), calc(var(--p, 0) * 10vh), 0)",
          }}
        />

        <Sparkle className="absolute left-[6%] top-28 h-8 w-8 text-coral" />
        <Sparkle className="absolute right-[8%] top-32 h-6 w-6 text-mint" />
        <Sparkle className="absolute bottom-40 left-[46%] h-10 w-10 text-[#8e77ff] lg:hidden" />

        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-80 lg:hidden"
          aria-hidden="true"
        >
          <path
            d="M-20 100 C 220 20, 380 120, 620 60 S 1000 10, 1220 80"
            stroke="#8e77ff"
            strokeWidth="3"
            strokeDasharray="2 12"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <StoryCanvas story={story} phoneRef={phoneRef} />

        <div className="relative mx-auto grid h-full max-w-6xl items-center gap-12 px-6 pb-36 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-28 lg:pt-24">
          <div className="text-center lg:text-left">
            <div className="grid">
              <div className={layerClass(step === 0)} inert={step !== 0}>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/15">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-mint"
                  />
                  Etkinlik sonrası ortak yolculuk
                </p>
                <h1 className="mt-7 text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl">
                  Etkinlik bitti,{" "}
                  <span className="text-gradient">yolculuk başlasın!</span>
                </h1>
                <p className="mt-5 inline-block -rotate-2 font-hand text-4xl text-coral sm:text-5xl">
                  Aynı etkinlikteyiz, aynı yoldayız.
                </p>
                <p className="mx-auto mt-5 max-w-xl text-lg text-white/70 lg:mx-0">
                  Konser çıkışı taksi kuyruğu, derbi sonrası otopark trafiği,
                  gece yarısı dolu duraklar. Eventra, aynı etkinlikten aynı
                  yöne dönenleri buluşturur.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-night shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                  >
                    Etkinlikleri Keşfet
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                  <a
                    href="#nasil-calisir"
                    className="rounded-full px-8 py-4 text-base font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10"
                  >
                    Nasıl çalışır?
                  </a>
                </div>
                <p className="mt-9 hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/50 lg:flex">
                  <span className="animate-bounce motion-reduce:animate-none">
                    ↓
                  </span>
                  Kaydır ve izle
                </p>
              </div>

              {storySteps.map((item, index) => {
                const active = step === index + 1;

                return (
                  <div
                    key={item.number}
                    className={`hidden lg:block ${layerClass(active)}`}
                    aria-hidden={!active}
                    inert={!active}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-violet to-coral text-2xl font-extrabold">
                      {item.number}
                    </span>
                    <p className="mt-6 font-hand text-4xl text-coral">
                      {item.hand}
                    </p>
                    <h2 className="mt-1 text-5xl font-extrabold leading-tight tracking-tight">
                      {item.title}
                    </h2>
                    <p className="mt-5 max-w-lg text-lg text-white/70">
                      {item.text}
                    </p>

                    {item.number === 3 && (
                      <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link
                          href="/events"
                          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-night shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                        >
                          Etkinlikleri Keşfet
                          <Icon name="arrow" className="h-4 w-4" />
                        </Link>
                        {!user && (
                          <Link
                            href="/kayit"
                            className="rounded-full px-8 py-4 text-base font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10"
                          >
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
              className="mt-10 hidden items-center gap-2 lg:flex"
            >
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                    step === dot ? "w-8 bg-white" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div
              ref={phoneRef}
              className="relative"
              style={{
                width: `calc(${PHONE_W}px * var(--s, 1))`,
                height: `calc(${PHONE_H}px * var(--s, 1))`,
                transform:
                  "perspective(1200px) rotateY(calc(var(--mx, 0) * 9deg)) rotateX(calc(var(--my, 0) * -7deg)) rotate(calc(-3deg + var(--p, 0) * 6deg))",
                willChange: "transform",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -left-14 top-24 z-20 hidden -rotate-6 lg:grid"
              >
                {chipsA.map((chip, index) => (
                  <span
                    key={chip.text}
                    className={`col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-xl transition-opacity duration-500 motion-reduce:transition-none ${
                      chipIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-mint text-night">
                      <Icon name={chip.icon} className="h-3.5 w-3.5" />
                    </span>
                    {chip.text}
                  </span>
                ))}
              </div>

              <div
                aria-hidden="true"
                className="absolute -right-12 bottom-32 z-20 hidden rotate-6 lg:grid"
              >
                {chipsB.map((chip, index) => (
                  <span
                    key={chip.text}
                    className={`col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-coral px-4 py-2 text-xs font-bold text-white shadow-xl transition-opacity duration-500 motion-reduce:transition-none ${
                      chipIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Icon name={chip.icon} className="h-4 w-4" />
                    {chip.text}
                  </span>
                ))}
              </div>

              <div
                aria-hidden="true"
                className="absolute left-0 top-0 origin-top-left"
                style={{
                  width: PHONE_W,
                  height: PHONE_H,
                  transform: "scale(var(--s, 1))",
                }}
              >
                <span className="absolute -left-[3px] top-24 h-7 w-[3px] rounded-l bg-zinc-600" />
                <span className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l bg-zinc-600" />
                <span className="absolute -left-[3px] top-52 h-12 w-[3px] rounded-l bg-zinc-600" />
                <span className="absolute -right-[3px] top-40 h-20 w-[3px] rounded-r bg-zinc-600" />

                <div className="h-full w-full rounded-[46px] bg-[#16161f] p-[7px] shadow-2xl shadow-black/60 ring-1 ring-white/20">
                  <div className="relative h-full w-full overflow-hidden rounded-[39px] bg-soft">
                    <StatusBar />
                    {screens.map((screen, index) => (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-500 motion-reduce:transition-none ${
                          screenIndex === index
                            ? "translate-y-0 opacity-100"
                            : "translate-y-3 opacity-0"
                        }`}
                      >
                        {screen}
                      </div>
                    ))}
                    <TabBar />
                    <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
                    <div className="pointer-events-none absolute inset-0 z-30 bg-linear-to-br from-white/20 via-transparent to-transparent" />
                    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
                      <div
                        className="absolute inset-y-0 w-1/3 -skew-x-[18deg] bg-linear-to-r from-transparent via-white/25 to-transparent"
                        style={{ left: "calc(var(--p, 0) * 130% - 20%)" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs text-white/60">
              Örnek ekranlar · demo verisi
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}