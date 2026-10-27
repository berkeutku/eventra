import type { CrowdLevel, RankedMeetingPoint } from "@/lib/meeting-points";

const CROWD_COLOR: Record<CrowdLevel, string> = {
  low: "#00d5a0",
  medium: "#ffb547",
  high: "#ff6b6b",
};

const legend: { level: CrowdLevel; label: string }[] = [
  { level: "low", label: "düşük" },
  { level: "medium", label: "orta" },
  { level: "high", label: "yüksek" },
];

export default function VenuePlan({
  ranked,
  selectedId,
}: {
  ranked: RankedMeetingPoint[];
  selectedId?: string | null;
}) {
  return (
    <div>
      <svg
        viewBox="0 0 400 260"
        role="img"
        aria-label="Etkinlik alanının şematik planı ve önerilen buluşma noktaları"
        className="h-auto w-full"
      >
        <rect
          x="90"
          y="55"
          width="220"
          height="150"
          rx="44"
          fill="#ffffff"
          stroke="#6c4dff"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <rect x="112" y="77" width="176" height="106" rx="30" fill="#efebff" />
        <text
          x="200"
          y="134"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.5"
          fill="#6c4dff"
        >
          ETKİNLİK ALANI
        </text>

        {ranked.map(({ point, rank }) => {
          const selected = point.id === selectedId;
          const color = CROWD_COLOR[point.crowd];

          return (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={selected ? 24 : 19}
                fill={color}
                fillOpacity="0.25"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="13"
                fill={selected ? "#6c4dff" : "#ffffff"}
                stroke={selected ? "#ffffff" : color}
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={point.y + 4.5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="800"
                fill={selected ? "#ffffff" : "#101020"}
              >
                {rank}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <li className="font-bold text-ink">Kalabalık:</li>
        {legend.map((item) => (
          <li key={item.level} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CROWD_COLOR[item.level] }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}