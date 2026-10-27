import RouteSketch from "@/components/RouteSketch";
import VenuePlan from "@/components/VenuePlan";
import {
  crowdLabel,
  findMeetingPoint,
  rankMeetingPoints,
} from "@/lib/meeting-points";

type Props = {
  origin: string;
  meetingPoint: string;
  destination: string;
  durationMinutes: number;
};

export default function RouteSummary({
  origin,
  meetingPoint,
  destination,
  durationMinutes,
}: Props) {
  const ranked = rankMeetingPoints();
  const known = findMeetingPoint(meetingPoint);
  const match = known
    ? ranked.find((item) => item.point.id === known.id)
    : undefined;

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-extrabold tracking-tight">Rota özeti</h2>
        <span className="rounded-full bg-sun/30 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-ink">
          Demo
        </span>
      </div>

      <RouteSketch
        origin={origin}
        meetingPoint={meetingPoint}
        destination={destination}
        durationMinutes={durationMinutes}
      />

      {match && (
        <div className="mt-8 grid items-center gap-6 border-t border-line pt-8 sm:grid-cols-2">
          <VenuePlan ranked={ranked} selectedId={match.point.id} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Buluşma noktası
            </p>
            <p className="mt-1 text-xl font-extrabold">{match.point.name}</p>
            <p className="mt-2 text-sm text-muted">
              Önerilen noktalar arasında{" "}
              <span className="font-bold text-ink">{match.rank}. sırada</span>{" "}
              (%{match.score} puan).
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              <li>{match.point.walkMinutes} dakika yürüyüş</li>
              <li>Tahmini kalabalık: {crowdLabel(match.point.crowd)}</li>
              <li>{match.point.lit ? "Aydınlık" : "Aydınlatması az"}</li>
              <li>
                {match.point.stepFree ? "Basamaksız erişim" : "Basamak var"}
              </li>
            </ul>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        Şematik gösterim ölçekli değildir. Mekan planı, yürüyüş süreleri ve
        kalabalık tahminleri kurgusal demo verisidir. Gerçek harita, navigasyon
        ya da kalabalık verisi kullanılmaz.
      </p>
    </div>
  );
}