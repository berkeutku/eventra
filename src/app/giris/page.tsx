import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap | Eventra",
  description: "Eventra demo girişi: rolünü seç ve etkinlikleri keşfet.",
};

export default function LoginPage() {
  return (
    <main className="bg-surface px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Giriş yap
        </h1>
        <p className="mt-4 text-lg text-muted">
          Adını gir ve bu etkinlikte sürücü mü yolcu mu olduğunu seç.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-muted ring-1 ring-line">
          <p className="font-medium text-ink">Bu bir demo girişidir.</p>
          <p className="mt-1">
            Parola ve e-posta istenmez, gerçek bilgi girme. Girdiğin ad ve rol
            yalnızca bu tarayıcıda saklanır. Gerçek hesap ve güvenli giriş
            sistemi backend aşamasında eklenecek.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}