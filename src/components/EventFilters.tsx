"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Icon from "@/components/Icons";
import {
  describeWhen,
  eventsHref,
  type DayOption,
  type FilterState,
  type WhenFilter,
} from "@/lib/event-filter-rules";
import type { CityOption, SourceFilter } from "@/lib/events";

// Hazır tarih seçenekleri ("Tümü" ayrıca gösterilir).
const QUICK: { value: WhenFilter; label: string }[] = [
  { value: "today", label: "Bugün" },
  { value: "tomorrow", label: "Yarın" },
  { value: "weekend", label: "Bu hafta sonu" },
  { value: "week", label: "7 gün" },
  { value: "month", label: "30 gün" },
];

const POPULAR_CITY_COUNT = 6;

const chip =
  "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors";
const chipOn = "bg-night text-white";
const chipOff = "bg-white text-ink ring-1 ring-line hover:bg-lilac";
const label = "text-xs font-extrabold uppercase tracking-widest text-muted";
const scrollRow =
  "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden";
// Telefonda kaydırılır, geniş ekranda alt satıra geçer.
const wrapRow =
  "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function EventFilters({
  state,
  when,
  cities,
  days,
  dayCounts,
  source,
  showSource,
}: {
  state: FilterState;
  when: WhenFilter;
  cities: CityOption[];
  days: DayOption[];
  dayCounts: Record<string, number>;
  source: SourceFilter;
  showSource: boolean;
}) {
  const router = useRouter();
  const [rangeOpen, setRangeOpen] = useState(
    when === "custom" && Boolean(state.bit && state.bit !== state.bas),
  );
  const [from, setFrom] = useState(state.bas ?? days[0]?.key ?? "");
  const [to, setTo] = useState(state.bit ?? state.bas ?? "");

  const href = (changes: Partial<FilterState>) => eventsHref(state, changes);
  const go = (changes: Partial<FilterState>) => router.push(href(changes), { scroll: false });

  const popular = cities.slice(0, POPULAR_CITY_COUNT);
  const rest = [...cities.slice(POPULAR_CITY_COUNT)].sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );
  const selectedCity = cities.find((city) => city.key === state.sehir);
  const selectedInRest = Boolean(
    state.sehir && !popular.some((city) => city.key === state.sehir),
  );

  const singleDay =
    when === "custom" && state.bas && (!state.bit || state.bit === state.bas)
      ? state.bas
      : null;

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") ?? "")
      .trim()
      .slice(0, 80);
    go({ q: value || undefined });
  }

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!from) {
      return;
    }

    go({ tarih: "custom", bas: from, bit: to && to !== from ? to : undefined });
  }

  // Etkin filtre etiketleri: her biri tek dokunuşla kaldırılabilir.
  const active: { key: string; text: string; remove: Partial<FilterState> }[] = [];

  if (state.q) {
    active.push({ key: "q", text: `“${state.q}”`, remove: { q: undefined } });
  }
  if (when !== "all") {
    active.push({
      key: "tarih",
      text: describeWhen(when, state.bas, state.bit),
      remove: { tarih: undefined },
    });
  }
  if (state.sehir) {
    active.push({
      key: "sehir",
      text: selectedCity?.name ?? state.sehir,
      remove: { sehir: undefined },
    });
  }
  if (showSource && source !== "all") {
    active.push({
      key: "kaynak",
      text: source === "real" ? "Gerçek etkinlikler" : "Demo etkinlikler",
      remove: { kaynak: undefined },
    });
  }

  return (
    <section
      aria-label="Etkinlik filtreleri"
      className="mt-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6"
    >
      <form role="search" onSubmit={onSearch} className="flex gap-2">
        <label htmlFor="event-q" className="sr-only">
          Etkinlik, mekân veya şehir ara
        </label>
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>
          <input
            key={state.q ?? ""}
            id="event-q"
            type="search"
            name="q"
            defaultValue={state.q ?? ""}
            maxLength={80}
            autoComplete="off"
            placeholder="Etkinlik, mekân, şehir"
            className="min-h-12 w-full rounded-full border border-line bg-surface pl-12 pr-4 text-base text-ink placeholder:text-muted/70 focus:border-violet focus:bg-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="min-h-12 shrink-0 rounded-full bg-violet px-6 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Ara
        </button>
      </form>

      {/* Ne zaman? */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className={label}>Ne zaman?</p>
          <button
            type="button"
            onClick={() => setRangeOpen((open) => !open)}
            aria-expanded={rangeOpen}
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-violet hover:underline"
          >
            <Icon name="calendar" className="h-4 w-4" />
            Tarih aralığı seç
          </button>
        </div>

        <div className={`${wrapRow} mt-3`}>
          <Link
            href={href({ tarih: undefined })}
            prefetch={false}
            scroll={false}
            aria-current={when === "all" ? "page" : undefined}
            className={`${chip} ${when === "all" ? chipOn : chipOff}`}
          >
            Tümü
          </Link>
          {QUICK.map((option) => (
            <Link
              key={option.value}
              href={href({ tarih: option.value })}
              prefetch={false}
              scroll={false}
              aria-current={when === option.value ? "page" : undefined}
              className={`${chip} ${when === option.value ? chipOn : chipOff}`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {/* Tarih şeridi: önümüzdeki 14 gün */}
        <ol aria-label="Gün seç" className={`${scrollRow} mt-3`}>
          {days.map((day) => {
            const count = dayCounts[day.key] ?? 0;
            const selected = singleDay === day.key;
            const empty = count === 0;

            return (
              <li key={day.key} className="shrink-0">
                <Link
                  href={href({ tarih: "custom", bas: day.key, bit: undefined })}
                  prefetch={false}
                  scroll={false}
                  aria-current={selected ? "date" : undefined}
                  aria-label={`${day.day} ${day.month}, ${count} etkinlik`}
                  className={`flex w-16 flex-col items-center rounded-2xl px-2 py-2.5 text-center transition-colors ${
                    selected
                      ? "bg-violet text-white shadow-md"
                      : empty
                        ? "bg-surface text-muted/70 hover:bg-lilac"
                        : "bg-surface text-ink hover:bg-lilac"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase ${
                      selected ? "text-white/80" : day.weekend ? "text-coral-ink" : "text-muted"
                    }`}
                  >
                    {day.top}
                  </span>
                  <span className="mt-0.5 text-xl font-extrabold leading-none">
                    {day.day}
                  </span>
                  <span className={`text-[11px] ${selected ? "text-white/80" : "text-muted"}`}>
                    {day.month}
                  </span>
                  <span
                    className={`mt-1.5 rounded-full px-1.5 text-[10px] font-bold ${
                      selected
                        ? "bg-white/20 text-white"
                        : empty
                          ? "text-muted/60"
                          : "bg-white text-violet"
                    }`}
                  >
                    {empty ? "—" : count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        {rangeOpen ? (
          <form
            onSubmit={applyRange}
            className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl bg-lilac/60 p-4"
          >
            <div>
              <label htmlFor="event-from" className="text-xs font-bold text-ink">
                Başlangıç
              </label>
              <input
                id="event-from"
                type="date"
                required
                value={from}
                min={days[0]?.key}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1 block min-h-11 rounded-xl border border-line bg-white px-3 text-base text-ink"
              />
            </div>
            <div>
              <label htmlFor="event-to" className="text-xs font-bold text-ink">
                Bitiş (isteğe bağlı)
              </label>
              <input
                id="event-to"
                type="date"
                value={to}
                min={from || days[0]?.key}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1 block min-h-11 rounded-xl border border-line bg-white px-3 text-base text-ink"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-full bg-night px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Uygula
            </button>
          </form>
        ) : null}
      </div>

      {/* Nerede? */}
      {cities.length > 0 ? (
        <div className="mt-6">
          <p className={label}>Nerede?</p>
          <div className={`${wrapRow} mt-3`}>
            <Link
              href={href({ sehir: undefined })}
              prefetch={false}
              scroll={false}
              aria-current={!state.sehir ? "page" : undefined}
              className={`${chip} ${!state.sehir ? chipOn : chipOff}`}
            >
              Tüm şehirler
            </Link>
            {popular.map((city) => {
              const isOn = state.sehir === city.key;

              return (
                <Link
                  key={city.key}
                  href={href({ sehir: city.key })}
                  prefetch={false}
                  scroll={false}
                  aria-current={isOn ? "page" : undefined}
                  className={`${chip} ${isOn ? chipOn : chipOff}`}
                >
                  <Icon name="pin" className="h-4 w-4" />
                  {city.name}
                  <span className={isOn ? "text-white/70" : "text-muted"}>{city.total}</span>
                </Link>
              );
            })}
            {rest.length > 0 ? (
              <>
                <label htmlFor="event-city-more" className="sr-only">
                  Diğer şehirler
                </label>
                <select
                  id="event-city-more"
                  value={selectedInRest ? state.sehir : ""}
                  onChange={(event) => go({ sehir: event.target.value || undefined })}
                  className={`${chip} ${selectedInRest ? chipOn : chipOff} cursor-pointer appearance-none pr-4`}
                >
                  <option value="">Diğer şehirler ({rest.length}) ▾</option>
                  {rest.map((city) => (
                    <option key={city.key} value={city.key}>
                      {city.name} ({city.total})
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Kaynak: yalnızca gerçek etkinlikler açıkken */}
      {showSource ? (
        <div className="mt-6">
          <p className={label}>Etkinlik türü</p>
          <div className="mt-3 inline-flex rounded-full bg-surface p-1">
            {(
              [
                ["all", "Hepsi"],
                ["real", "Gerçek"],
                ["demo", "Demo"],
              ] as const
            ).map(([value, text]) => (
              <Link
                key={value}
                href={href({ kaynak: value === "all" ? undefined : value })}
                prefetch={false}
                scroll={false}
                aria-current={source === value ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold transition-colors ${
                  source === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {text}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {active.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="text-sm font-bold text-muted">Seçimler:</span>
          {active.map((item) => (
            <Link
              key={item.key}
              href={href(item.remove)}
              prefetch={false}
              scroll={false}
              aria-label={`${item.text} filtresini kaldır`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lilac px-3 text-sm font-bold text-violet hover:bg-violet hover:text-white"
            >
              {item.text}
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link
            href="/events"
            prefetch={false}
            scroll={false}
            className="ml-auto text-sm font-bold text-ink underline-offset-4 hover:underline"
          >
            Hepsini temizle
          </Link>
        </div>
      ) : null}
    </section>
  );
}
