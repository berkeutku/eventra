// Giriş sonrası yönlendirmelerde yalnızca site içi yollara izin verir.
// Dış adreslere yönlendirme (open redirect) bu fonksiyonla engellenir.
const FALLBACK = "/panel";
const LOOP_PREFIXES = ["/giris", "/kayit"];

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") {
    return FALLBACK;
  }

  const path = value.trim();

  if (path.length === 0 || path.length > 200) {
    return FALLBACK;
  }

  // Yalnızca "/" ile başlayan site içi yollar. "//site.com" ve "/\site.com"
  // gibi tarayıcının dış adres sayabileceği biçimler reddedilir.
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return FALLBACK;
  }

  // Satır sonu gibi kontrol karakterlerini reddet.
  for (const char of path) {
    const code = char.charCodeAt(0);

    if (code < 32 || code === 127) {
      return FALLBACK;
    }
  }

  // Giriş veya kayıt sayfasına geri yönlendirme döngü oluşturur.
  const loops = LOOP_PREFIXES.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(`${prefix}?`) ||
      path.startsWith(`${prefix}/`),
  );

  return loops ? FALLBACK : path;
}