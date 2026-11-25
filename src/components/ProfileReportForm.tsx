"use client";

import { useActionState } from "react";
import {
  reportProfileAction,
  type ProfileReportState,
} from "@/app/profil/[id]/report-actions";

const initialState: ProfileReportState = {};

// Sunucudaki sınırla aynı (lib/profile-report.ts → MAX_PROFILE_REPORT_DETAILS).
const MAX_DETAILS = 300;

// Başka birinin profilinde görünen "Profili bildir" bölümü. Varsayılan olarak kapalıdır.
export default function ProfileReportForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(reportProfileAction, initialState);

  return (
    <details className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <summary className="cursor-pointer text-sm font-bold text-muted hover:text-ink">
        Uygunsuz fotoğraf ya da yazı mı var? Profili bildir
      </summary>

      {state.ok ? (
        <p role="status" className="mt-3 rounded-xl bg-sea p-3 text-sm font-medium text-mint-ink">
          {state.message}
        </p>
      ) : (
        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <label htmlFor="profile-report-details" className="block text-sm font-medium text-ink">
            Kısaca ne gördün? (isteğe bağlı)
          </label>
          <textarea
            id="profile-report-details"
            name="details"
            rows={3}
            maxLength={MAX_DETAILS}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
          />
          {state.message ? (
            <p role="alert" className="text-sm font-medium text-coral-ink">
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-full bg-night px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Gönderiliyor…" : "Bildir"}
          </button>
        </form>
      )}
    </details>
  );
}
