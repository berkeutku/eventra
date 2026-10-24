import Image from "next/image";

type Props = {
  size?: "md" | "lg";
  tone?: "dark" | "light";
};

export default function Logo({ size = "md", tone = "dark" }: Props) {
  const iconHeight = size === "lg" ? "h-10" : "h-7";
  const textSize = size === "lg" ? "text-3xl" : "text-2xl";
  const textColor = tone === "light" ? "text-white" : "text-ink";

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
        className={`${textSize} ${textColor} font-extrabold lowercase tracking-tight`}
      >
        eventra
      </span>
    </span>
  );
}