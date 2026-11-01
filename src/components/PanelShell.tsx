import Link from "next/link";
import type { ReactNode } from "react";

export default function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/panel"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-violet hover:underline"
        >
          &larr; Profil
        </Link>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="mt-2 text-muted">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}