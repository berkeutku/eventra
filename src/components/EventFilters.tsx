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
  // Şehir ya da tür seçiliyse ek filtreler açık gelir.
  const advancedOpen = Boolean(cityKey) || source !== "all";

  return (
    <form
      action="/events"
      method="get"
      className="mt-6 rounded-2xl bg-lilac/60 p-4 sm:p-5"
    >
      {category ? <input type="hidden" name="kategori" value={category} /> : null}

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
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
        <button
          type="submit"
          className="min-h-12 rounded-full bg-violet px-6 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Ara
        </button>
      </div>

      <details className="mt-3" open={advancedOpen}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-violet">
          Daha fazla filtre
        </summary>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
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
              <label
                htmlFor="event-source"
                className="text-sm font-bold text-ink"
              >
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
        </div>
        <p className="mt-3 text-xs text-muted">
          Seçimlerin &quot;Ara&quot; düğmesine bastığında uygulanır.
        </p>
      </details>

      <Link
        href="/events"
        className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-ink underline-offset-4 hover:underline"
      >
        Filtreleri temizle
      </Link>
    </form>
  );
}