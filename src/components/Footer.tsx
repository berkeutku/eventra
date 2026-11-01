import Link from "next/link";
import Logo from "@/components/Logo";
import { realEventsEnabled } from "@/lib/flags";

export default function Footer() {
  const real = realEventsEnabled();

  return (
    <footer className="px-4 pb-6 pt-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-night px-8 py-10 text-white">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo tone="light" />
            <p className="mt-3 font-hand text-2xl text-coral">
              Your Event. Your Route.
            </p>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/65">
            {real
              ? "Eventra bir demo sürümüdür. Yolculuklar gerçek ödeme ya da kimlik doğrulaması içermez, masraf paylaşımı tahminidir. Gerçek etkinlik bilgileri iş ortağımız biletimGO'dan alınır, bilet satışı Eventra tarafından değil biletimGO üzerinden yapılır."
              : "Eventra demo sürümüdür. Gerçek yolculuk, ödeme veya kimlik doğrulama hizmeti sunmaz. Bilet doğrulama ve masraf paylaşımı simülasyondur."}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm">
          <a
            href="https://github.com/berkeutku/eventra"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white underline-offset-4 hover:underline"
          >
            Kaynak kodu (GitHub)
          </a>
          <Link
            href="/gizlilik"
            className="font-bold text-white underline-offset-4 hover:underline"
          >
            Gizlilik ve veri notu
          </Link>
          <span className="text-white/60">
            {real
              ? "Demo etkinlik etiketli etkinlikler ve görselleri kurgusaldır. Ziyaret istatistikleri çerez kullanılmadan toplanır."
              : "Etkinlikler kurgusaldır, etkinlik görselleri temsilidir. Ziyaret istatistikleri çerez kullanılmadan toplanır."}
          </span>
        </div>
      </div>
    </footer>
  );
}