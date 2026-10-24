import EventArt from "@/components/EventArt";
import Icon from "@/components/Icons";
import { categoryMeta } from "@/data/events";

export default function PhoneMockup() {
  const meta = categoryMeta.concert;

  return (
    <figure className="relative mx-auto w-[260px] sm:w-[290px]">
      <div
        aria-hidden="true"
        className="absolute -left-10 top-24 z-10 hidden -rotate-6 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-xl sm:flex"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-mint text-night">
          <Icon name="check" className="h-3.5 w-3.5" />
        </span>
        Aynı etkinlik, aynı yol
      </div>
      <div
        aria-hidden="true"
        className="absolute -right-8 bottom-28 z-10 hidden rotate-6 items-center gap-2 rounded-full bg-coral px-4 py-2 text-xs font-bold text-white shadow-xl sm:flex"
      >
        <Icon name="users" className="h-4 w-4" />3 boş koltuk
      </div>

      <div
        aria-hidden="true"
        className="overflow-hidden rounded-[2.4rem] border-[9px] border-black bg-white shadow-2xl shadow-black/50 ring-1 ring-white/20"
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] font-bold text-ink">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-black" />
          <span>100%</span>
        </div>

        <div className="px-4 pb-5 pt-2">
          <p className="text-center text-xs font-extrabold">Yolculuk Detayı</p>

          <div
            className={`relative mt-3 h-28 overflow-hidden rounded-2xl ${meta.gradient}`}
          >
            <EventArt
              category="concert"
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-3 text-white">
              <p className="text-sm font-extrabold">Gece Yolculuğu Konseri</p>
              <p className="text-[10px] opacity-85">Liman Sahnesi, İstanbul</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className="h-3 w-3 rounded-full bg-violet" />
              <span className="my-1 w-px flex-1 border-l-2 border-dashed border-violet/40" />
            </div>
            <div className="pb-3">
              <p className="text-[10px] text-muted">Buluşma noktası</p>
              <p className="text-xs font-bold">Ana kapı önü</p>
              <p className="text-[10px] text-muted">23:30</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="pt-1">
              <span className="block h-3 w-3 rounded-full bg-mint" />
            </div>
            <div>
              <p className="text-[10px] text-muted">Varış noktası</p>
              <p className="text-xs font-bold">Kadıköy</p>
              <p className="text-[10px] text-muted">00:15 (tahmini)</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-lilac p-3">
            <div>
              <p className="text-[10px] font-bold text-muted">Kişi başı</p>
              <p className="text-lg font-extrabold text-violet">≈ 150 TL</p>
            </div>
            <p className="text-right text-[10px] text-muted">
              Toplam 600 TL
              <br />4 kişi
            </p>
          </div>

          <div className="mt-3 rounded-full bg-violet py-2.5 text-center text-xs font-bold text-white">
            Katıl
          </div>
        </div>
      </div>

      <figcaption className="mt-4 text-center text-xs text-white/60">
        Örnek ekran · demo verisi
      </figcaption>
    </figure>
  );
}