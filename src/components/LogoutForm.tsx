"use client";

import { useId, useRef, useState } from "react";
import { logoutAction } from "@/app/hesap/actions";
import { disablePushOnThisDevice } from "@/lib/push-client";

const logout = logoutAction as (data: FormData) => Promise<void>;

export default function LogoutForm({
  className,
  buttonClassName,
  label = "Çıkış yap",
}: {
  className?: string;
  buttonClassName: string;
  label?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, setPending] = useState(false);

  async function handleLogout(formData: FormData) {
    setPending(true);

    try {
      // Bu cihazın push aboneliği oturum açıkken kaldırılır, sonra çıkış yapılır.
      await disablePushOnThisDevice();
      await logout(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonClassName}
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          // Arka plana (dialog öğesinin kendisine) dokunmak pencereyi kapatır.
          if (event.target === event.currentTarget && !pending) {
            event.currentTarget.close();
          }
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl bg-white p-0 text-ink shadow-2xl ring-1 ring-black/5 backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      >
        <form action={handleLogout} className="p-6 sm:p-7">
          <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
            Çıkış yapmak istediğine emin misin?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Hesabından çıkış yapılacak ve bu cihazdaki telefon bildirimleri
            kapatılacak. İstediğin zaman tekrar giriş yapabilirsin.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold text-ink ring-1 ring-line transition-colors hover:bg-lilac disabled:opacity-60"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-violet px-5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Çıkış yapılıyor…" : "Evet, çıkış yap"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
