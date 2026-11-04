import LazyMap from "@/components/LazyMap";
import RouteSummary from "@/components/RouteSummary";
import { distanceKm } from "@/lib/geo-rules";
import { getRideGeo } from "@/lib/ride-geo";

type Props = {
  rideId: string;
  origin: string;
  meetingPoint: string;
  destination: string;
  durationMinutes: number;
};

// Koordinatlı yolculuklarda gerçek harita, diğerlerinde eski şematik gösterim.
export default async function RideRouteCard(props: Props) {
  let geo: Awaited<ReturnType<typeof getRideGeo>> = null;

  try {
    geo = await getRideGeo(props.rideId);
  } catch (error) {
    console.error(
      "Harita bilgisi okunamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  if (!geo) {
    return (
      <RouteSummary
        origin={props.origin}
        meetingPoint={props.meetingPoint}
        destination={props.destination}
        durationMinutes={props.durationMinutes}
      />
    );
  }

  const markers = [
    {
      id: "origin",
      lng: geo.origin.lng,
      lat: geo.origin.lat,
      color: "#6c4dff",
      title: `Başlangıç (yaklaşık): ${props.origin}`,
    },
    {
      id: "meeting",
      lng: geo.meeting.lng,
      lat: geo.meeting.lat,
      color: "#ff6b6b",
      title: `Buluşma: ${props.meetingPoint}`,
    },
    {
      id: "dest",
      lng: geo.dest.lng,
      lat: geo.dest.lat,
      color: "#00d5a0",
      title: `Varış (yaklaşık): ${props.destination}`,
    },
  ];

  const straightKm = Math.round(
    distanceKm(geo.origin, geo.meeting) + distanceKm(geo.meeting, geo.dest),
  );

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <h2 className="text-2xl font-extrabold tracking-tight">Harita ve rota</h2>

      <p className="mt-2 text-sm text-muted">
        {geo.path && geo.distanceMeters
          ? `Yaklaşık ${Math.max(1, Math.round(geo.distanceMeters / 1000))} km${
              geo.durationSeconds
                ? ` · yaklaşık ${Math.round(geo.durationSeconds / 60)} dakika`
                : ""
            }. Rota hesabı tahmindir, trafik içermez.`
          : `Rota çizilemedi, noktalar arasındaki düz çizgi gösteriliyor (kuş uçuşu yaklaşık ${straightKm} km).`}
      </p>

      <div className="mt-4">
        <LazyMap
          label="Yolculuk rotası haritası"
          markers={markers}
          path={geo.path}
        />
      </div>

      <ul className="mt-4 space-y-1 text-sm text-muted">
        <li>
          <span className="font-bold text-ink">Başlangıç:</span>{" "}
          {props.origin} (haritada yaklaşık)
        </li>
        <li>
          <span className="font-bold text-ink">Buluşma:</span>{" "}
          {props.meetingPoint}
        </li>
        <li>
          <span className="font-bold text-ink">Varış:</span>{" "}
          {props.destination} (haritada yaklaşık)
        </li>
      </ul>

      <p className="mt-3 text-xs text-muted">
        Başlangıç ve varış noktaları yaklaşık 1 km hassasiyetle gösterilir.
        Harita verisi © OpenStreetMap katkıcıları.
      </p>
    </div>
  );
}