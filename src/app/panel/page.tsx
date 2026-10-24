import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Panelim | Eventra",
  description: "Eventra demo kullanıcı paneli: yolculuklarını yönet.",
};

export default function PanelPage() {
  return (
    <main className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Panelim
        </h1>
        <p className="mt-4 text-lg text-muted">
          Rolünü ve yolculuklarını buradan takip et.
        </p>

        <Dashboard />
      </div>
    </main>
  );
}