import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

        <LoginForm next={nextPath} />
      </div>
    </main>
  );
}