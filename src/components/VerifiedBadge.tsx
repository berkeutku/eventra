import Icon from "@/components/Icons";

export default function VerifiedBadge({
  label = "Bilet doğrulandı (demo)",
}: {
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sea px-2.5 py-0.5 text-xs font-bold text-mint-ink">
      <Icon name="check" className="h-3 w-3" />
      {label}
    </span>
  );
}