import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kayıt Ol | Eventra",
  description:
    "Eventra'ya hesap oluştur ve etkinlik sonrası ortak yolculuklara katıl.",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/panel");
  }

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Hesap oluştur
        </h1>
        <p className="mt-4 text-lg text-muted">
          Etkinlik sonrası ortak yolculukta buluşmak için Eventra&apos;ya katıl.
        </p>

        <div className="mt-6 rounded-2xl bg-lilac p-4 text-sm text-muted">
          <p className="font-bold text-ink">Bu bir demo projedir.</p>
          <p className="mt-1">
            Gerçek e-posta adresi ve gerçek parola kullanma. Parolan
            şifrelenerek saklanır, ama bu proje üretim güvenliği için
            tasarlanmadı.
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}