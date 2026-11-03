export default function DriverRating({
  rating,
  count,
  tone = "dark",
}: {
  rating?: number | null;
  count?: number;
  tone?: "dark" | "light";
}) {
  if (!count || rating === null || rating === undefined) {
    return null;
  }

  const text = rating.toFixed(1).replace(".", ",");

  return (
    <span
      aria-label={`Sürücü puanı 5 üzerinden ${text}, ${count} değerlendirme`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        tone === "light"
          ? "bg-white/20 text-white"
          : "bg-[#fff3d6] text-[#7a4b00]"
      }`}
    >
      <span aria-hidden="true">★</span>
      {text}
      <span aria-hidden="true" className="font-normal opacity-80">
        ({count})
      </span>
    </span>
  );
}