import type { EventCategory } from "@/data/events";

const bars = [
  { x: 40, h: 30 },
  { x: 72, h: 55 },
  { x: 104, h: 40 },
  { x: 136, h: 75 },
  { x: 168, h: 50 },
  { x: 200, h: 90 },
  { x: 232, h: 45 },
  { x: 264, h: 70 },
  { x: 296, h: 35 },
  { x: 328, h: 60 },
  { x: 360, h: 28 },
];

export default function EventArt({
  category,
  className,
}: {
  category: EventCategory;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {category === "concert" && (
        <>
          <g fill="#fff" fillOpacity="0.14">
            <path d="M70 0 30 200h90z" />
            <path d="M200 0 150 200h100z" />
            <path d="M330 0 280 200h90z" />
          </g>
          <g fill="#fff" fillOpacity="0.3">
            {bars.map((bar) => (
              <rect
                key={bar.x}
                x={bar.x}
                y={200 - bar.h}
                width="12"
                height={bar.h}
                rx="6"
              />
            ))}
          </g>
        </>
      )}

      {category === "match" && (
        <g stroke="#fff" strokeOpacity="0.35" strokeWidth="3">
          <rect x="20" y="20" width="360" height="160" rx="10" />
          <path d="M200 20v160" />
          <circle cx="200" cy="100" r="34" />
          <rect x="20" y="62" width="52" height="76" />
          <rect x="328" y="62" width="52" height="76" />
        </g>
      )}

      {category === "theatre" && (
        <>
          <g fill="#fff" fillOpacity="0.16">
            <path d="M0 0h74c-12 66-12 134 0 200H0z" />
            <path d="M400 0h-74c12 66 12 134 0 200h74z" />
          </g>
          <circle cx="200" cy="200" r="100" fill="#fff" fillOpacity="0.14" />
          <path
            d="m200 40 9 20 22 2-17 15 5 22-19-11-19 11 5-22-17-15 22-2z"
            fill="#fff"
            fillOpacity="0.55"
          />
        </>
      )}
    {category === "festival" && (<g><path d="M0 50 Q100 110 200 50 T400 50" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" /><g fill="#fff" fillOpacity="0.4"><circle cx="50" cy="82" r="9" /><circle cx="130" cy="86" r="9" /><circle cx="270" cy="22" r="9" /><circle cx="350" cy="30" r="9" /></g><g fill="#fff" fillOpacity="0.18"><circle cx="90" cy="150" r="34" /><circle cx="210" cy="140" r="48" /><circle cx="330" cy="156" r="30" /></g></g>)}{category === "standup" && (<g><path d="M200 0 120 200h160z" fill="#fff" fillOpacity="0.14" /><path d="M200 120v50M170 172h60" stroke="#fff" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" /><rect x="184" y="64" width="32" height="52" rx="16" fill="#fff" fillOpacity="0.4" /></g>)}{category === "university" && (<g fill="#fff" fillOpacity="0.3"><path d="M200 50 330 105 200 160 70 105z" /><path d="M120 135v32c0 14 36 26 80 26s80-12 80-26v-32l-80 36z" fillOpacity="0.18" /></g>)}{category === "other" && (<g fill="#fff" fillOpacity="0.22"><circle cx="200" cy="100" r="70" /><circle cx="200" cy="100" r="44" fillOpacity="0.2" /><circle cx="70" cy="50" r="14" /><circle cx="340" cy="150" r="18" /></g>)}</svg>
  );
}