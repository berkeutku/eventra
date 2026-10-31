"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/app/panel/account-actions";

const initialState: DeleteAccountState = {};

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

export default function DeleteAccountCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  useEffect(() => {
    if (!state.done) {
      return;
    }

    async function finish() {
      // Bu cihazdaki telefon bildirimi aboneliğini de tarayıcıdan kaldır.
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          const subscription =
            await registration?.pushManager?.getSubscription();
          await subscription?.unsubscribe();
        }
      } catch {
        // Sessizce devam et.
      }

      router.replace("/hesap-silindi");
    }

    void finish();
  }, [state.done, router]);

  return (
    <div className="rounded-3xl border border-coral/40 bg-peach/40 p-8">
      <h2 className="text-2xl font-extrabold tracking-tight">Hesabı sil</h2>
      <p className="mt-2 text-sm text-muted">
        Hesabını silersen oluşturduğun yolculuklar, katıldığın yolculuklar,
        bildirimlerin, bilet doğrulama kayıtların ve telefon bildirim abonelikler
        kalıcı olarak silinir. Yolculuğuna katılmış kişilere iptal bildirimi
        gider. Bu işlem geri alınamaz.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 rounded-full border border-coral px-5 py-2.5 text-sm font-bold text-coral-ink transition-colors hover:bg-peach"
        >
          Hesabımı silmek istiyorum
        </button>
      ) : (
        <form action={formAction} className="mt-5 space-y-4">
          {state.message && (
            <p
              role="alert"
              className="rounded-2xl bg-white p-4 text-sm font-medium text-coral-ink"
            >
              {state.message}
            </p>
          )}

          <div>
            <label htmlFor="delete-password" className="block text-sm font-bold">
              Parolan
            </label>
            <input
              id="delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="confirm"
              value="yes"
              required
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              Hesabımın ve tüm verilerimin kalıcı olarak silineceğini
              anlıyorum.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending || state.done}
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Siliniyor…" : "Hesabı kalıcı olarak sil"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}