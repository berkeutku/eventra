import Link from "next/link";
import type { CityOption, SourceFilter } from "@/lib/events";

const fieldClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

export default function EventFilters({
  query,
  cityKey,
  cities,
  category,
  source,
  showSource,
}: {
  query: string;
  cityKey: string;
  cities: CityOption[];
  category?: string;
  source: SourceFilter;
  showSource: boolean;
}) {
  return (
    <form
      action="/events"
      method="get"
      className="mt-8 grid gap-4 rounded-2xl bg-lilac/60 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4"
    >
      {category ? <input type="hidden" name="kategori" value={category} /> : null}

      <div className="lg:col-span-2">
        <label htmlFor="event-q" className="text-sm font-bold text-ink">
          Etkinlik, mekan veya şehir ara
        </label>
        <input
          id="event-q"
          type="search"
          name="q"
          defaultValue={query}
          maxLength={80}
          autoComplete="off"
          placeholder="Örn. stand-up"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="event-city" className="text-sm font-bold text-ink">
          Şehir
        </label>
        <select
          id="event-city"
          name="sehir"
          defaultValue={cityKey}
          className={fieldClass}
        >
          <option value="">Tüm şehirler</option>
          {cities.map((city) => (
            <option key={city.key} value={city.key}>
              {city.name} ({city.total})
            </option>
          ))}
        </select>
      </div>

      {showSource ? (
        <div>
          <label htmlFor="event-source" className="text-sm font-bold text-ink">
            Etkinlik türü
          </label>
          <select
            id="event-source"
            name="kaynak"
            defaultValue={source}
            className={fieldClass}
          >
            <option value="all">Hepsi</option>
            <option value="real">Gerçek etkinlikler (biletimGO)</option>
            <option value="demo">Demo etkinlikler</option>
          </select>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button
          type="submit"
          className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Filtrele
        </button>
        <Link
          href="/events"
          className="rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-lilac"
        >
          Filtreleri temizle
        </Link>
      </div>
    </form>
  );
}