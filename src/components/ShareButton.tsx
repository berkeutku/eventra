"use client";

import { useToast } from "@/components/Toast";

export default function ShareButton({ title }: { title: string }) {
  const toast = useToast();

  async function handleShare() {
    const url = window.location.href;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.show("Bağlantı panoya kopyalandı.");
    } catch (error) {
      // Kullanıcı paylaşım penceresini kapattıysa hata sayılmaz.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.show(
        "Bağlantı paylaşılamadı. Adres çubuğundan kopyalayabilirsin.",
        "info",
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
    >
      Etkinliği paylaş
    </button>
  );
}