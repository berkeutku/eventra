const timeZone = "Europe/Istanbul";

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone,
  });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}