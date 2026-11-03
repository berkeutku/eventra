import type { Metadata } from "next";
import Link from "next/link";
import CategoryChips from "@/components/CategoryChips";
import EventCard from "@/components/EventCard";
import EventFilters from "@/components/EventFilters";
import { categoryMeta, type EventCategory } from "@/data/events";
import {
  countByCategory,
  listCities,
  listEvents,
  parseWhen,
  realEventsEnabled,
  type SourceFilter,
} from "@/lib/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Etkinlikler | Eventra",
  description: "Yaklaşan etkinlikleri keşfet ve ortak yolculuk planla.",
};

type Param = string | string[] | undefined;

type Props = {
  searchParams: Promise<Record<string, Param>>;
};

function first(value: Param): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const realEnabled = realEventsEnabled();

  const category = (Object.keys(categoryMeta) as EventCategory[]).find(
    (item) => item === first(params.kategori),
  );
  const cityRaw = first(params.sehir);
  const cityKey = /^[a-z0-9-]{1,40}$/.test(cityRaw) ? cityRaw : "";
  const query = first(params.q).trim().slice(0, 80);
  const sourceRaw = first(params.kaynak);
  const source: SourceFilter =
    realEnabled && (sourceRaw === "real" || sourceRaw === "demo")
      ? sourceRaw
      : "all";
  const when = parseWhen(first(params.tarih));
  const pageRaw = Number.parseInt(first(params.sayfa), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const filters = {
    category,
    cityKey: cityKey || undefined,
    query: query || undefined,
    source,
    when,
  };

  const [result, cities, counts] = await Promise.all([
    listEvents({ ...filters, page }),
    listCities(filters),
    countByCategory(filters),
  ]);

  function pageHref(target: number): string {
    const search = new URLSearchParams();

    if (category) {
      search.set("kategori", category);
    }
    if (cityKey) {
      search.set("sehir", cityKey);
    }
    if (query) {
      search.set("q", query);
    }
    if (source !== "all") {
      search.set("kaynak", source);
    }
    if (when !== "all") {
      search.set("tarih", when);
    }
    if (target > 1) {
      search.set("sayfa", String(target));
    }

    const text = search.toString();
    return text ? `/events?${text}` : "/events";
  }

  const navButton =
    "rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac";

  return (
    <main className="px-6 py-10 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-6xl">
          Bugün hangi etkinliğe gidiyoruz?
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Katılacağın etkinliği seç, aynı yöne gidenlerle yolculuk planla.
        </p>

        <EventFilters
          query={query}
          cityKey={cityKey}
          cities={cities}
          category={category}
          source={source}
          when={when}
          showSource={realEnabled}
        />

        <div className="mt-6">
          <CategoryChips
            active={category}
            counts={counts}
            params={{
              sehir: cityKey || undefined,
              q: query || undefined,
              kaynak: source !== "all" ? source : undefined,
              tarih: when !== "all" ? when : undefined,
            }}
          />
        </div>

        <p className="mt-4 text-sm text-muted">
          {result.total} etkinlik ·{" "}
          {realEnabled
            ? "Gerçek etkinlik bilgileri biletimGO'dan alınır ve değişebilir. Demo etkinlik etiketli olanlar kurgusaldır."
            : "Bu sayfadaki etkinlikler demo amaçlı kurgusal verilerdir."}
        </p>

        {result.items.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-black/5">
            <p className="font-bold text-ink">Bu filtrelere uyan etkinlik yok</p>
            <p className="mt-1 text-sm text-muted">
              Filtreleri değiştirebilir ya da tüm etkinlikleri görebilirsin.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
            >
              Tümünü gör
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((event) => (
              <EventCard key={event.id} event={event} headingLevel={2} />
            ))}
          </div>
        )}

        {result.pageCount > 1 ? (
          <nav
            aria-label="Sayfalama"
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {result.page > 1 ? (
              <Link href={pageHref(result.page - 1)} className={navButton}>
                Önceki
              </Link>
            ) : null}
            <span className="text-sm font-bold text-ink">
              Sayfa {result.page} / {result.pageCount}
            </span>
            {result.page < result.pageCount ? (
              <Link href={pageHref(result.page + 1)} className={navButton}>
                Sonraki
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}