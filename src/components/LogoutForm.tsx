"use client";

import { logoutAction } from "@/app/hesap/actions";
import { disablePushOnThisDevice } from "@/lib/push-client";

const logout = logoutAction as (data: FormData) => Promise<void>;

export default function LogoutForm({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName: string;
}) {
  async function handleLogout(formData: FormData) {
    // Bu cihazın push aboneliği oturum açıkken kaldırılır, sonra çıkış yapılır.
    await disablePushOnThisDevice();
    await logout(formData);
  }

  return (
    <form action={handleLogout} className={className}>
      <button type="submit" className={buttonClassName}>
        Çıkış
      </button>
    </form>
  );
}