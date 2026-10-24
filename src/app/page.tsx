import Link from "next/link";

const steps = [
  {
    title: "Etkinliği seç",
    text: "Konser, derbi veya tiyatro. Katılacağın etkinliği bul.",
    color: "from-violet to-pink",
  },
  {
    title: "Yolculuğunu bul",
    text: "Aynı etkinliğe gidenlerin paylaştığı yolculuklara göz at ya da kendin oluştur.",
    color: "from-mint to-sky",
  },
  {
    title: "Birlikte dön",
    text: "Buluşma noktasını, koltuğunu ve tahmini masrafı tek ekranda gör.",
    color: "from-coral to-sun",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pb-32 sm:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-pink/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-24 h-80 w-80 rounded-full bg-violet/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sun/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="inline-block -rotate-2 rounded-full bg-sun px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-ink shadow-md shadow-sun/40">
            Your Event. Your Route.
          </p>
          <h1 className="mx-auto mt-8 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Etkinlik bitti,
            <br />
            <span className="text-gradient">yolculuk başlasın!</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted sm:text-xl">
            Aynı etkinliğe katılan kişilerle ortak yolculuk planla. Taksi
            kuyruğuna ve kalabalığa gerek yok.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="rounded-full bg-linear-to-r from-violet to-pink px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet/30 transition-transform hover:-translate-y-0.5"
            >
              Etkinlikleri Keşfet
            </Link>
            <a
              href="#nasil-calisir"
              className="rounded-full bg-white px-8 py-4 text-base font-semibold text-ink shadow-md ring-1 ring-line transition-transform hover:-translate-y-0.5"
            >
              Nasıl çalışır?
            </a>
          </div>
        </div>
      </section>

      <section id="nasil-calisir" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-5xl">
            Üç adımda yolculuk
          </h2>

          <ol className="mt-14 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${step.color} text-lg font-bold text-white`}
                >
                  {index + 1}
                </span>
                <h3 className="mt-6 text-xl font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}