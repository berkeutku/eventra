import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş Yap | Eventra",
  description: "Eventra hesabınla giriş yap.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/panel");
  }

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Giriş yap
        </h1>
        <p className="mt-4 text-lg text-muted">
          Hesabınla giriş yap ve yolculuklarını yönet.
        </p>

        <div className="mt-6 rounded-2xl bg-lilac p-4 text-sm text-muted">
          <p className="font-bold text-ink">Bu bir demo projedir.</p>
          <p className="mt-1">
            Gerçek e-posta adresi ve gerçek parola kullanma. Parola sıfırlama
            ve e-posta doğrulama henüz yok.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}