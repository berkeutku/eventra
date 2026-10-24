import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="px-4 pb-6 pt-12">
      <div className="mx-auto max-w-5xl rounded-3xl bg-lilac px-8 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet">
              Your Event. Your Route.
            </p>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Eventra bir portföy demo projesidir. Gerçek yolculuk, ödeme veya
            kimlik doğrulama hizmeti sunmaz. Bilet doğrulama ve masraf
            paylaşımı simülasyondur.
          </p>
        </div>
      </div>
    </footer>
  );
}