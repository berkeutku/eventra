import Icon from "@/components/Icons";

// Takvim dosyasını (.ics) indirir. Dosya sunucudan gelir, bu yüzden normal bir bağlantıdır.
export default function CalendarLink({ eventId }: { eventId: string }) {
  return (
    <a
      href={`/events/${eventId}/takvim`}
      download
      className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
    >
      <Icon name="calendar" className="h-4 w-4" />
      Takvime ekle
    </a>
  );
}