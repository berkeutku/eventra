import { initialsOf } from "@/lib/profile-rules";

// Profil fotoğrafı; yoksa adın baş harfi gösterilir. Hem sunucuda hem tarayıcıda kullanılabilir.
export default function Avatar({
  userId,
  name,
  version,
  size = 40,
  className = "",
}: {
  userId: string;
  name: string;
  version?: number | null;
  size?: number;
  className?: string;
}) {
  if (version) {
    // Fotoğraf oturum gerektiren kendi rotamızdan gelir; next/image optimizasyonu burada gerekmez.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/avatar/${userId}?v=${version}`} alt="" width={size} height={size} loading="lazy" className={`shrink-0 rounded-full bg-lilac object-cover ${className}`} style={{ width: size, height: size }} />;
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-violet font-extrabold text-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initialsOf(name)}
    </span>
  );
}
