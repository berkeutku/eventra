"use client";

import { switchRoleAction } from "@/app/panel/actions";
import { roleLabels, type Role } from "@/lib/roles";

export default function RoleSwitcher({ currentRole }: { currentRole: Role }) {
  const nextRole: Role = currentRole === "driver" ? "passenger" : "driver";

  return (
    <form action={switchRoleAction} className="mt-6 rounded-2xl bg-surface p-5">
      <input type="hidden" name="role" value={nextRole} />
      <p className="text-sm font-bold text-ink">
        Aktif rolün: {roleLabels[currentRole]}
      </p>
      <p className="mt-1 text-sm text-muted">
        Yolculuk oluşturmak için Sürücü, bir yolculuğa katılmak için Yolcu
        rolünde olmalısın. İstediğin zaman değiştirebilirsin.
      </p>
      <button
        type="submit"
        className="mt-4 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky"
      >
        {roleLabels[nextRole]} rolüne geç
      </button>
    </form>
  );
}