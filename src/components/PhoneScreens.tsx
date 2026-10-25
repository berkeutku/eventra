import Image from "next/image";
import EventArt from "@/components/EventArt";
import Icon, { categoryIcon, type IconName } from "@/components/Icons";
import { categoryMeta, type EventCategory } from "@/data/events";

export function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-end justify-between px-6 pb-1.5 text-[11px] font-bold text-ink">
      <span>9:41</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="flex items-end gap-px">
          <span className="h-1 w-[3px] rounded-sm bg-ink" />
          <span className="h-1.5 w-[3px] rounded-sm bg-ink" />
          <span className="h-2 w-[3px] rounded-sm bg-ink" />
          <span className="h-2.5 w-[3px] rounded-sm bg-ink" />
        </span>
        <span className="h-2.5 w-5 rounded-[3px] border border-ink/60 p-px">
          <span className="block h-full w-4/5 rounded-[1px] bg-ink" />
        </span>
      </span>
    </div>
  );
}

const tabs: { label: string; icon: IconName; active: boolean }[] = [
  { label: "Ana Sayfa", icon: "home", active: false },
  { label: "Etkinlikler", icon: "ticket", active: true },
  { label: "Profil", icon: "user", active: false },
];

export function TabBar() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 border-t border-line bg-white/95 pb-3 pt-1.5">
      <ul className="grid grid-cols-3">
        {tabs.map((tab) => (
          <li
            key={tab.label}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
              tab.active ? "text-violet" : "text-muted"
            }`}
          >
            <Icon name={tab.icon} className="h-[18px] w-[18px]" />
            {tab.label}
          </li>
        ))}
      </ul>
      <span className="mx-auto mt-2 block h-1 w-24 rounded-full bg-ink/80" />
    </div>
  );
}

function ScreenBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-16 top-11 overflow-hidden px-4 pt-1">
      {children}
    </div>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-black/5">
        <Icon name="arrow" className="h-3 w-3 rotate-180" />
      </span>
      <p className="text-[13px] font-extrabold">{title}</p>
    </div>
  );
}

function ring(highlighted: boolean): string {
  return highlighted
    ? "scale-[1.03] shadow-xl shadow-violet/30 ring-2 ring-violet"
    : "shadow-sm ring-1 ring-black/5";
}

function MiniEventCard({
  category,
  title,
  place,
  highlighted,
}: {
  category: EventCategory;
  title: string;
  place: string;
  highlighted: boolean;
}) {
  const meta = categoryMeta[category];

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white transition-all duration-500 motion-reduce:transition-none ${ring(highlighted)}`}
    >
      <div className={`relative h-[58px] ${meta.gradient}`}>
        <EventArt
          category={category}
          className="absolute inset-0 h-full w-full"
        />
        <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-ink">
          {meta.label}
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-[12px] font-extrabold leading-tight">{title}</p>
        <p className="mt-0.5 text-[10px] text-muted">{place}</p>
      </div>
    </div>
  );
}

export function EventsScreen({ highlight }: { highlight: boolean }) {
  const chips: EventCategory[] = ["concert", "match", "theatre"];

  return (
    <ScreenBody>
      <div className="flex items-center gap-1.5">
        <Image
          src="/logo-mark.png"
          alt=""
          width={366}
          height={272}
          className="h-4 w-auto"
        />
        <span className="text-[13px] font-extrabold lowercase tracking-tight">
          eventra
        </span>
      </div>
      <p className="mt-2.5 text-[19px] font-extrabold leading-[1.15] tracking-tight">
        Bugün hangi etkinliğe gidiyoruz?
      </p>

      <div className="mt-2.5 flex gap-1.5">
        {chips.map((category) => {
          const meta = categoryMeta[category];

          return (
            <span
              key={category}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold ring-1 ring-black/5"
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-full ${meta.soft} ${meta.accent}`}
              >
                <Icon name={categoryIcon[category]} className="h-2.5 w-2.5" />
              </span>
              {meta.label}
            </span>
          );
        })}
      </div>

      <div className="mt-3 space-y-2.5">
        <MiniEventCard
          category="concert"
          title="Gece Yolculuğu Konseri"
          place="Liman Sahnesi · 21 Kas · 20:30"
          highlighted={highlight}
        />
        <MiniEventCard
          category="match"
          title="Şehir Kupası Finali"
          place="Boğaz Stadyumu · 19 Ara · 18:00"
          highlighted={false}
        />
        <MiniEventCard
          category="theatre"
          title="Son Perde"
          place="Körfez Sanat Merkezi · 5 Ara · 20:00"
          highlighted={false}
        />
      </div>
    </ScreenBody>
  );
}

const demoRides = [
  { to: "Kadıköy", time: "23:30", seats: 3, share: 150 },
  { to: "Beşiktaş", time: "22:45", seats: 1, share: 100 },
  { to: "Üsküdar", time: "00:10", seats: 2, share: 120 },
];

export function RidesScreen({ highlight }: { highlight: boolean }) {
  const meta = categoryMeta.concert;

  return (
    <ScreenBody>
      <TopBar title="Ortak yolculuklar" />

      <div className={`relative mt-3 h-[54px] overflow-hidden rounded-2xl ${meta.gradient}`}>
        <EventArt
          category="concert"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-3 pb-1.5 pt-4 text-white">
          <p className="text-[12px] font-extrabold leading-tight">
            Gece Yolculuğu Konseri
          </p>
          <p className="text-[9px] opacity-85">Liman Sahnesi, İstanbul</p>
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5 text-[9px] font-bold">
        <span className="rounded-full bg-night px-2.5 py-1 text-white">
          Kalkış saati
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-black/10">
          Masraf
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-black/10">
          2+ koltuk
        </span>
      </div>

      <ul className="mt-3 space-y-2.5">
        {demoRides.map((ride, index) => (
          <li
            key={ride.to}
            className={`rounded-2xl bg-white p-3 transition-all duration-500 motion-reduce:transition-none ${ring(highlight && index === 0)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-extrabold leading-tight">
                  Liman Sahnesi → {ride.to}
                </p>
                <p className="mt-0.5 text-[10px] text-muted">
                  Kalkış {ride.time} · {ride.seats} boş koltuk
                </p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-extrabold leading-none text-violet">
                  {ride.share} TL
                </p>
                <p className="mt-0.5 text-[8px] text-muted">kişi başı</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScreenBody>
  );
}

export function DetailScreen({ joined }: { joined: boolean }) {
  const meta = categoryMeta.concert;

  return (
    <ScreenBody>
      <TopBar title="Yolculuk Detayı" />

      <div className={`relative mt-2.5 h-[52px] overflow-hidden rounded-2xl ${meta.gradient}`}>
        <EventArt
          category="concert"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-3 pb-1.5 pt-4 text-white">
          <p className="text-[12px] font-extrabold leading-tight">
            Liman Sahnesi → Kadıköy
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        <div className="flex flex-col items-center pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-violet" />
          <span className="my-1 w-px flex-1 border-l-2 border-dashed border-violet/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-mint" />
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-muted">
              Buluşma noktası
            </p>
            <p className="text-[12px] font-extrabold leading-tight">
              Ana kapı önü
            </p>
            <p className="text-[10px] text-muted">Kalkış 23:30</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-muted">
              Varış noktası
            </p>
            <p className="text-[12px] font-extrabold leading-tight">Kadıköy</p>
            <p className="text-[10px] text-muted">Tahmini varış 00:15</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-lilac p-3">
        <div>
          <p className="text-[9px] font-bold text-muted">
            Yolculuk dolunca kişi başı
          </p>
          <p className="text-[19px] font-extrabold leading-tight text-violet">
            150 TL
          </p>
        </div>
        <p className="text-right text-[9px] text-muted">
          Toplam 600 TL
          <br />
          sürücü dahil 4 kişi
        </p>
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline justify-between text-[10px]">
          <span className="font-bold">Koltuklar</span>
          <span className="font-bold text-ink">
            {joined ? "2 / 3" : "3 / 3"} boş
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-violet transition-all duration-700 motion-reduce:transition-none"
            style={{ width: joined ? "33%" : "0%" }}
          />
        </div>
      </div>

           <div className="mt-2.5 flex items-center justify-between text-[10px]">
        <span className="font-bold">Yolcular</span>
        {joined ? (
          <span className="flex items-center gap-1.5 font-bold text-mint-ink">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-[9px] font-extrabold text-night">
              S
            </span>
            Sen
          </span>
        ) : (
          <span className="text-muted">Henüz yolcu yok</span>
        )}
      </div>

      <div
        className={`mt-3 flex h-10 items-center justify-center gap-1.5 rounded-full text-[12px] font-bold transition-colors duration-500 motion-reduce:transition-none ${
          joined ? "bg-mint text-night" : "bg-violet text-white"
        }`}
      >
        {joined && <Icon name="check" className="h-4 w-4" />}
        {joined ? "Yolculuğa katıldın" : "Yolculuğa katıl"}
      </div>
    </ScreenBody>
  );
}