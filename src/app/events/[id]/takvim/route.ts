import { getEventById } from "@/lib/events";

export const dynamic = "force-dynamic";

const DEFAULT_HOURS = 3;

// iCalendar (RFC 5545) metin kaçışları.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

// Satırlar 75 bayttan uzunsa katlanır (devam satırları boşlukla başlar).
function fold(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 75) {
    return line;
  }

  const parts: string[] = [];
  let current = "";
  let size = 0;

  for (const char of line) {
    const width = Buffer.byteLength(char, "utf8");
    const limit = parts.length === 0 ? 75 : 74;

    if (size + width > limit) {
      parts.push(current);
      current = char;
      size = width;
    } else {
      current += char;
      size += width;
    }
  }

  parts.push(current);
  return parts.join("\r\n ");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return new Response("Etkinlik bulunamadı", { status: 404 });
  }

  const start = new Date(event.startsAt);
  const parsedEnd = event.endsAt ? new Date(event.endsAt) : null;
  const end =
    parsedEnd && parsedEnd > start
      ? parsedEnd
      : new Date(start.getTime() + DEFAULT_HOURS * 3_600_000);

  const origin = new URL(request.url).origin;
  const title =
    event.source === "biletimgo" ? event.title : `${event.title} (demo)`;
  const description = [
    event.description.slice(0, 300),
    "",
    `Ortak yolculuk için: ${origin}/events/${event.id}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eventra//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventra`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(`${event.venue}, ${event.city}`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${origin}/events/${event.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(`${lines.map(fold).join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="eventra-etkinlik.ics"',
      "Cache-Control": "no-store",
    },
  });
}