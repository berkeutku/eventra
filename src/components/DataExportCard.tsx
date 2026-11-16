"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { cardClass } from "@/components/ui/Card";

export default function DataExportCard() {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/hesap/verilerim", { method: "POST" });

      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setMessage(problem?.message ?? "Verilerin indirilemedi.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eventra-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.show("Verilerin indirildi.");
    } catch {
      setMessage("Bağlantı hatası. İnternetini kontrol edip tekrar dene.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="text-xl font-extrabold tracking-tight">Verilerimi indir</h2>
      <p className="mt-2 text-sm text-muted">
        Eventra&apos;da hakkında saklanan verilerin bir kopyasını JSON dosyası
        olarak indirebilirsin: profilin, yolculukların, katılımların, bilet
        doğrulamaların, favorilerin, taleplerin, puanların, mesajların ve
        bildirimlerin. Parola, bilet kodu özeti ve diğer kullanıcıların kimlik
        bilgileri dosyaya konmaz.
      </p>
      <Button
        onClick={handleDownload}
        disabled={pending}
        variant="secondary"
        className="mt-4"
      >
        {pending ? "Hazırlanıyor…" : "Verilerimi indir (JSON)"}
      </Button>
      {message && (
        <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
          {message}
        </p>
      )}
    </section>
  );
}
