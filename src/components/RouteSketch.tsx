import Icon from "@/components/Icons";

type Props = {
  origin: string;
  meetingPoint: string;
  destination: string;
  durationMinutes: number;
};

function shorten(text: string, max = 26): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function RouteSketch({
  origin,
  meetingPoint,
  destination,
  durationMinutes,
}: Props) {
  const stops = [
    { label: "Başlangıç", name: origin, tone: "bg-lilac text-violet" },
    { label: "Buluşma", name: meetingPoint, tone: "bg-violet text-white" },
    { label: "Varış", name: destination, tone: "bg-mint text-night" },
  ];

  return (
    <div className="mt-6">
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-[16.67%] right-[16.67%] top-5 border-t-[3px] border-dotted border-violet/50"
        />
        <span
          aria-hidden="true"
          className="absolute left-[75%] top-5 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-violet shadow-md ring-1 ring-black/5"
        >
          <Icon name="car" className="h-5 w-5" />
        </span>

        <ol className="relative z-10 grid grid-cols-3 gap-2">
          {stops.map((stop) => (
            <li
              key={stop.label}
              className="flex flex-col items-center text-center"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full ring-4 ring-white ${stop.tone}`}
              >
                <Icon name="pin" className="h-5 w-5" />
              </span>
              <span className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">
                {stop.label}
              </span>
              <span className="mt-1 break-words text-sm font-extrabold leading-snug">
                {shorten(stop.name)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-5 text-center text-sm font-bold text-ink">
        Tahmini yolculuk süresi: yaklaşık {durationMinutes} dakika
      </p>
    </div>
  );
}