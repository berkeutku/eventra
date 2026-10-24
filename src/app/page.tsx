import Link from "next/link";
import CategoryChips from "@/components/CategoryChips";
import EventCard from "@/components/EventCard";
import Icon, { type IconName } from "@/components/Icons";
import type { EventItem } from "@/data/events";
import { getEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

const steps: { title: string; text: string; icon: IconName; tint: string }[] = [
  {
    title: "Etkinliği seç",
    text: "Konser, derbi veya tiyatro. Katılacağın etkinliği bul.",
    icon: "ticket",
    tint: "bg-lilac text-violet",
  },
  {
    title: "Yolculuğunu bul",
    text: "Aynı etkinliğe gidenlerin paylaştığı yolculuklara göz at ya da kendin oluştur.",
    icon: "route",
    tint: "bg-peach text-coral-ink",
  },
  {
    title: "Birlikte dön",
    text: "Buluşma noktasını, koltuğunu ve tahmini masrafı tek ekranda gör.",
    icon: "car",
    tint: "bg-sea text-mint-ink",
  },
];

async function loadUpcomingEvents(): Promise<EventItem[]> {
  try {
    return (await getEvents()).slice(0, 3);
  } catch {
    return [];
  }
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

export default async function HomePage() {
  const upcoming = await loadUpcomingEvents();

  return (
    <main>
      <section
        className="relative overflow-hidden rounded-b-[2.5rem] bg-night text-white sm:rounded-b-[4rem]"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 12% 0%, rgba(108,77,255,0.7), transparent 70%), radial-gradient(45% 45% at 95% 25%, rgba(255,107,107,0.45), transparent 70%), radial-gradient(60% 40% at 50% 115%, rgba(0,213,160,0.28), transparent 70%)",
        }}
      >
        <Sparkle className="absolute left-[8%] top-16 h-8 w-8 text-coral" />
        <Sparkle className="absolute right-[10%] top-28 h-6 w-6 text-mint" />
        <Sparkle className="absolute bottom-28 right-[22%] h-10 w-10 text-[#8e77ff]" />

        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-80"
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

        <div className="relative mx-auto max-w-5xl px-6 pb-28 pt-16 text-center sm:pb-36 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/80 ring-1 ring-white/15">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-mint"
            />
            Your Event. Your Route.
          </p>
          <h1 className="mx-auto mt-8 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            Etkinlik bitti,{" "}
            <span className="text-gradient">yolculuk başlasın!</span>
          </h1>
          <p className="mt-6 -rotate-2 font-hand text-4xl text-coral sm:text-5xl">
            Aynı etkinlikteyiz, aynı yoldayız.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
            Aynı etkinliğe katılan kişilerle ortak yolculuk planla. Taksi
            kuyruğuna ve kalabalığa gerek yok.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-night shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
            >
              Başla
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <a
              href="#nasil-calisir"
              className="rounded-full px-8 py-4 text-base font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10"
            >
              Nasıl çalışır?
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 pt-16 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bugün hangi etkinliğe gidiyoruz?
          </h2>
          <div className="mt-6">
            <CategoryChips />
          </div>

          {upcoming.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          <Link
            href="/events"
            className="mt-8 inline-flex items-center gap-2 font-bold text-violet hover:underline"
          >
            Tüm etkinlikleri gör
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="nasil-calisir" className="mt-20 bg-soft px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl">
            Üç adımda yolculuk
          </h2>
          <ol className="mt-14 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.title}
                className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl ${step.tint}`}
                >
                  <Icon name={step.icon} className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 pt-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-linear-to-br from-violet to-[#9a6bff] px-8 py-14 text-center text-white sm:py-20">
          <Sparkle className="absolute right-8 top-8 h-8 w-8 text-white/40" />
          <Sparkle className="absolute bottom-8 left-10 h-6 w-6 text-mint" />
          <p className="font-hand text-3xl sm:text-4xl">
            iyi müzik, iyi insanlar, daha iyi yolculuklar.
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Boş koltuğun birine yol olsun.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/80">
            Sürücüysen yolculuğunu oluştur, yolcuysan sana uygun olanı bul.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="rounded-full bg-white px-8 py-4 text-base font-bold text-violet transition-transform hover:-translate-y-0.5"
            >
              Etkinlikleri Keşfet
            </Link>
            <Link
              href="/giris"
              className="rounded-full px-8 py-4 text-base font-bold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}