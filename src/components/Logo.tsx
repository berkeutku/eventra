import Image from "next/image";

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const iconHeight = size === "lg" ? "h-10" : "h-7";
  const textSize = size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logo-mark.png"
        alt=""
        width={366}
        height={272}
        className={`${iconHeight} w-auto`}
        priority
      />
      <span
        className={`text-gradient font-display ${textSize} font-bold lowercase tracking-tight`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        eventra
      </span>
    </span>
  );
}