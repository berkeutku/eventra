"use client";

import { useTransition } from "react";
import { switchRoleAction } from "@/app/panel/actions";
import { useToast } from "@/components/Toast";
import { roleLabels, type Role } from "@/lib/roles";

const ORDER: Role[] = ["passenger", "driver"];

export default function RoleToggle({
  currentRole,
  onDark = false,
}: {
  currentRole: Role;
  onDark?: boolean;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function choose(role: Role) {
    if (role === currentRole || pending) {
      return;
    }

    const data = new FormData();
    data.set("role", role);

    startTransition(async () => {
      const ok = await switchRoleAction(data);

      if (ok) {
        toast.show(`${roleLabels[role]} rolüne geçtin.`);
      } else {
        toast.show("Rol değiştirilemedi. Lütfen tekrar dene.", "info");
      }
    });
  }

  return (
    <div
      role="group"
      aria-label="Aktif rol"
      className={`inline-flex rounded-full p-1 ${onDark ? "bg-white/15" : "bg-lilac"}`}
    >
      {ORDER.map((role) => {
        const active = role === currentRole;
        const on = onDark ? "bg-white text-violet" : "bg-violet text-white";
        const off = onDark
          ? "text-white hover:bg-white/10"
          : "text-violet hover:bg-white";

        return (
          <button
            key={role}
            type="button"
            onClick={() => choose(role)}
            aria-pressed={active}
            disabled={pending}
            className={`min-h-10 rounded-full px-5 text-sm font-bold transition-colors disabled:cursor-wait ${active ? on : off}`}
          >
            {roleLabels[role]}
          </button>
        );
      })}
    </div>
  );
}