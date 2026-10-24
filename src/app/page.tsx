import Link from "next/link";
import CategoryChips from "@/components/CategoryChips";
import CostCalculator from "@/components/CostCalculator";
import EventCard from "@/components/EventCard";
import Icon, { type IconName } from "@/components/Icons";
import PhoneMockup from "@/components/PhoneMockup";
import type { EventItem } from "@/data/events";
import { getEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

const valueStrip: { title: string; text: string; icon: IconName; tint: string }[] =
  [
    {
      title: "Aynı etkinlik",
      text: "Yalnızca aynı etkinliğe gidenlerle planla.",
      icon: "ticket",
      tint: "bg-lilac text-violet",
    },
    {
      title: "Aynı yön",
      text: "Gideceğin yöne giden bir yolculuk bul.",
      icon: "route",
      tint: "bg-peach text-coral-ink",
    },
    {
      title: "Paylaşılan masraf",
      text: "Yol masrafı herkes arasında eşit bölünür.",
      icon: "wallet",
      tint: "bg-sea text-mint-ink",
    },
  ];

const problems: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Taksi bulmak zor",
    text: "Etkinlik çıkışında taksi kuyrukları uzar ve fiyatlar yükselir.",
    icon: "car",
  },
  {
    title: "Toplu taşıma dolu",
    text: "Aynı anda binlerce kişi aynı duraklara yönelir.",
    icon: "bus",
  },
  {
    title: "Otopark çıkışı bitmiyor",
    text: "Özel aracı olanlar bile otoparktan çıkmak için bekler.",
    icon: "parking",
  },
  {
    title: "Herkes birbirinden habersiz",
    text: "Aynı yöne giden insanlar, ayrı ayrı araçlarla yola çıkar.",
    icon: "users",
  },
];

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

type FeatureStatus = "live" | "soon";

const features: {
  title: string;
  text: string;
  icon: IconName;
  status: FeatureStatus;
}[] = [
  {
    title: "Etkinliğe özel yolculuklar",
    text: "Her yolculuk bir etkinliğe bağlı. Plan yalnızca o etkinliğe gidenler arasında yapılır.",
    icon: "ticket",
    status: "live",
  },
  {
    title: "Şeffaf masraf paylaşımı",
    text: "Toplam masraf sürücü dahil herkese eşit bölünür. Tahmini tutarı baştan görürsün.",
    icon: "wallet",
    status: "live",
  },
  {
    title: "Buluşma noktası ve varış tahmini",
    text: "Sürücü buluşma noktasını ve kalkış saatini belirler, tahmini varış saati hesaplanır.",
    icon: "pin",
    status: "live",
  },
  {
    title: "Yolculuğa katılma",
    text: "Koltuk kapasitesi kontrolüyle yolculuğa katılma, gerçek veritabanıyla geliştiriliyor.",
    icon: "users",
    status: "soon",
  },
  {
    title: "Katılımcı doğrulama",
    text: "Bilet doğrulama akışı demo olarak simüle edilecek. Gerçek bilet entegrasyonu yok.",
    icon: "shield",
    status: "soon",
  },
  {
    title: "Rota ve harita",
    text: "Ücretsiz harita altyapısıyla açıklanabilir bir rota önerisi planlanıyor.",
    icon: "map",
    status: "soon",
  },
];

const driverPerks = [
  "Boş koltuklarını yol masrafına katkıya çevir.",
  "Buluşma noktasını ve kalkış saatini sen belirle.",
  "Aynı etkinliğe giden insanlarla yolculuk et.",
];

const passengerPerks = [
  "Taksi kuyruğuna ve kalabalığa girmeden dön.",
  "Kişi başı tahmini masrafı baştan gör.",
  "Buluşma noktası ve varış saati önceden belli olsun.",
];

const faqs = [
  {
    q: "Eventra nedir?",
    a: "Aynı etkinliğe katılan kişileri etkinlik sonrası ortak yolculuklarda buluşturmayı hedefleyen bir yolculuk paylaşım platformu. Şu an bir portföy demosu olarak geliştiriliyor.",
  },
  {
    q: "Gerçek ödeme alınıyor mu?",
    a: "Hayır. Masraf paylaşımı yalnızca tahmini bir hesaplama. Eventra para toplamaz, ödeme havuzu veya emanet sistemi yoktur.",
  },
  {
    q: "Bilet ve kimlik doğrulaması var mı?",
    a: "Henüz yok. Gerçek bir e-Devlet ya da bilet sağlayıcı entegrasyonu bulunmuyor. Doğrulama akışı ileride demo olarak simüle edilecek ve bunun demo olduğu açıkça belirtilecek.",
  },
  {
    q: "Giriş bilgilerim nerede saklanıyor?",
    a: "Şu an demo girişi kullanılıyor: yalnızca bir ad ve rol seçiyorsun, bunlar sadece senin tarayıcında kalıyor. Parolalı gerçek hesaplar geliştirme aşamasında. Gerçek kişisel bilgilerini girme.",
  },
  {
    q: "Hangi etkinlikler listeleniyor?",
    a: "Listelenen etkinlikler, mekanlar ve takımlar tamamen kurgusal demo verileridir.",
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

function StatusBadge({ status }: { status: FeatureStatus }) {
  return status === "live" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sea px-3 py-1 text-xs font-bold text-mint-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />
      Çalışıyor
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-peach px-3 py-1 text-xs font-bold text-coral-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
      Yakında
    </span>
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
        <Sparkle className="absolute left-[6%] top-16 h-8 w-8 text-coral" />
        <Sparkle className="absolute right-[8%] top-24 h-6 w-6 text-mint" />
        <Sparkle className="absolute bottom-32 left-[46%] h-10 w-10 text-[#8e77ff]" />

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

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-36 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-44">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/15">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-mint"
              />
              Etkinlik sonrası ortak yolculuk
            </p>
            <h1 className="mt-8 text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-7xl">
              Etkinlik bitti,{" "}
              <span className="text-gradient">yolculuk başlasın!</span>
            </h1>
            <p className="mt-6 inline-block -rotate-2 font-hand text-4xl text-coral sm:text-5xl">
              Aynı etkinlikteyiz, aynı yoldayız.
            </p>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 lg:mx-0">
              Konser çıkışı taksi kuyruğu, derbi sonrası otopark trafiği, gece
              yarısı dolu duraklar. Eventra, aynı etkinlikten aynı yöne
              dönenleri buluşturur.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
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
          </div>

          <PhoneMockup />
        </div>
      </section>

      <section className="relative z-10 -mt-14 px-6">
        <div className="mx-auto grid max-w-5xl gap-2 rounded-3xl bg-white p-3 shadow-xl shadow-violet/10 ring-1 ring-black/5 sm:grid-cols-3">
          {valueStrip.map((item) => (
            <div key={item.title} className="flex items-center gap-4 p-4">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${item.tint}`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
              </span>
              <div>
                <p className="font-extrabold">{item.title}</p>
                <p className="text-sm text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pt-24 sm:pt-32">
        <div className="reveal mx-auto max-w-6xl">
          <p className="font-hand text-3xl text-violet">sorun tanıdık mı?</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Çıkış kapısında herkes aynı şeyi arıyor.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Etkinlik biter, binlerce kişi aynı anda eve dönmeye çalışır. Bu
            kaosu yolculuk planına çevirmek için Eventra doğdu.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl bg-white p-6 shadow-lg shadow-violet/5 ring-1 ring-black/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-peach text-coral-ink">
                  <Icon name={item.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nasil-calisir" className="mt-24 bg-soft px-6 py-20 sm:mt-32 sm:py-28">
        <div className="reveal mx-auto max-w-6xl">
          <p className="text-center font-hand text-3xl text-violet">
            çözüm çok basit
          </p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight sm:text-5xl">
            Üç adımda yolculuk
          </h2>

          <ol className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-20 right-[-1rem] top-8 hidden border-t-[3px] border-dotted border-violet/30 sm:block"
                  />
                )}
                <span
                  className={`relative grid h-16 w-16 place-items-center rounded-3xl ${step.tint}`}
                >
                  <Icon name={step.icon} className="h-8 w-8" />
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-night text-xs font-extrabold text-white">
                    {index + 1}
                  </span>
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

      <section className="px-6 py-20 sm:py-28">
        <div className="reveal mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Neler yapabiliyorsun?
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Hangi özellikler bugün çalışıyor, hangileri yolda. Hiçbirini
            olduğundan farklı göstermiyoruz.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="flex flex-col rounded-3xl bg-white p-6 shadow-lg shadow-violet/5 ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac text-violet">
                    <Icon name={feature.icon} className="h-6 w-6" />
                  </span>
                  <StatusBadge status={feature.status} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold leading-snug">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-soft px-6 py-20 sm:py-28">
        <div className="reveal mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-hand text-3xl text-violet">kendin dene</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Masrafı paylaşınca yol hafifler.
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted">
              Toplam masrafı ve boş koltuk sayısını ayarla, kişi başı tutarın
              nasıl değiştiğini gör. Sürücü dahil herkes eşit öder.
            </p>
          </div>
          <CostCalculator />
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28">
        <div className="reveal mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl">
            Sürücü müsün, yolcu mu?
          </h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl bg-linear-to-br from-violet to-[#9a6bff] p-8 text-white sm:p-10">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
                <Icon name="car" className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold">Sürücüysen</h3>
              <ul className="mt-5 space-y-3 text-white/90">
                {driverPerks.map((perk) => (
                  <li key={perk} className="flex gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/giris"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-violet transition-transform hover:-translate-y-0.5"
              >
                Sürücü olarak başla
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5 sm:p-10">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sea text-mint-ink">
                <Icon name="user" className="h-7 w-7" />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold">Yolcuysan</h3>
              <ul className="mt-5 space-y-3 text-muted">
                {passengerPerks.map((perk) => (
                  <li key={perk} className="flex gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sea text-mint-ink">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/giris"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-night px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Yolcu olarak başla
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-soft px-6 py-20 sm:py-28">
        <div className="reveal mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Yaklaşan etkinlikler
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Katılacağın etkinliği seç, aynı yöne gidenlerle yolculuk planla.
          </p>
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

      <section className="px-6 py-20 sm:py-28">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl">
            Sık sorulan sorular
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl bg-white p-5 ring-1 ring-black/5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lilac text-lg text-violet transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-4">
        <div className="reveal relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-linear-to-br from-violet to-[#9a6bff] px-8 py-14 text-center text-white sm:py-20">
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