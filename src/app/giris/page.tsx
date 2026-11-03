import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Icon from "@/components/Icons";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş Yap | Eventra",
  description: "Eventra hesabınla giriş yap.",
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const user = await getCurrentUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="relative overflow-hidden px-6 py-10 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-10 h-60 w-60 rounded-full bg-violet/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-10 h-60 w-60 rounded-full bg-coral/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet text-white">
          <Icon name="ticket" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Tekrar hoş geldin!
        </h1>
        <p className="mt-4 text-lg text-muted">
          Hesabınla giriş yap ve yolculuklarını yönet.
        </p>

        <div className="mt-6 rounded-2xl bg-lilac p-4 text-sm text-muted">
          <p className="font-bold text-ink">
            <span className="mr-2 inline-block -rotate-2 rounded-md bg-sun px-2 py-0.5 text-xs font-bold text-[#412402]">
              Demo
            </span>
            Bu bir demo projedir.
          </p>
          <p className="mt-1">
            Gerçek e-posta adresi ve gerçek parola kullanma. Parola sıfırlama
            ve e-posta doğrulama henüz yok.
          </p>
        </div>

        <LoginForm next={nextPath} />
      </div>
    </main>
  );
}