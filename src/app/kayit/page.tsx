import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Icon from "@/components/Icons";
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
    <main className="relative overflow-hidden px-6 py-10 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-10 h-60 w-60 rounded-full bg-mint/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-10 h-60 w-60 rounded-full bg-violet/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-coral text-white">
          <Icon name="car" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Hesap oluştur
        </h1>
        <p className="mt-4 text-lg text-muted">
          Yola çıkmaya hazır mısın? Etkinlik sonrası ortak yolculukta buluşmak
          için Eventra&apos;ya katıl.
        </p>

        <div className="mt-6 rounded-2xl bg-lilac p-4 text-sm text-muted">
          <p className="font-bold text-ink">
            <span className="mr-2 inline-block -rotate-2 rounded-md bg-sun px-2 py-0.5 text-xs font-bold text-[#412402]">
              Demo
            </span>
            Bu bir demo projedir.
          </p>
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