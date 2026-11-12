// Yöneticiler kodda değil, ADMIN_EMAILS ortam değişkeninde (virgülle ayrılmış e-postalar) tutulur.
export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(email.trim().toLowerCase());
}