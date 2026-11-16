// biletimGO API istemcisi. Token yalnızca sunucuda kullanılır ve istek adresi (token içerir)
// hiçbir hata mesajına, günlüğe ya da çıktıya yazılmaz: yalnızca bir hata KODU fırlatılır.

const ENDPOINT = "https://www.biletimgo.com/api/v1/etkinlik-listesi";
const MAX_BYTES = 8_000_000;
const TIMEOUT_MS = 30_000;
const USER_AGENT =
  "Eventra-Sync/1.0 (+https://eventra-one-azure.vercel.app; student demo project)";

// 403 teşhisinde yalnızca bu güvenli başlıklar günlüğe yazılır.
const SAFE_HEADERS = [
  "server",
  "via",
  "cf-ray",
  "cf-cache-status",
  "x-sucuri-id",
  "x-amz-cf-id",
  "x-akamai-request-id",
  "retry-after",
  "content-type",
];

export type FetchLike = typeof fetch;

export type FetchFailure =
  | "auth"
  | "forbidden"
  | "forbidden_html"
  | "server"
  | "http"
  | "timeout"
  | "network"
  | "too_large"
  | "invalid_response";

export class BiletimgoError extends Error {
  code: FetchFailure;

  constructor(code: FetchFailure) {
    super(code);
    this.name = "BiletimgoError";
    this.code = code;
  }
}

// Engellenen yanıtı özetler: durum, güvenli başlıklar ve HTML sayfasının başlığı.
// İstek adresi, token ve yanıt gövdesinin geri kalanı hiçbir zaman yazılmaz.
async function describeBlock(response: Response): Promise<string> {
  const parts: string[] = [`status=${response.status}`];

  for (const name of SAFE_HEADERS) {
    const value = response.headers.get(name);

    if (value) {
      parts.push(`${name}=${value.slice(0, 80)}`);
    }
  }

  try {
    const html = (await response.text()).slice(0, 4000);
    const title = html.match(/<title[^>]*>([^<]{1,120})/i)?.[1];

    if (title) {
      parts.push(`title=${title.replace(/\s+/g, " ").trim().slice(0, 100)}`);
    }
  } catch {
    // Gövde okunamazsa başlıklar yine de yazılır.
  }

  return parts.join(" | ");
}

export async function fetchBiletimgoEvents(
  token: string,
  fetchImpl: FetchLike = fetch,
): Promise<unknown[]> {
  if (!token) {
    throw new BiletimgoError("auth");
  }

  let response: Response;

  try {
    response = await fetchImpl(
      `${ENDPOINT}?access_token=${encodeURIComponent(token)}`,
      {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    throw new BiletimgoError(
      name === "TimeoutError" || name === "AbortError" ? "timeout" : "network",
    );
  }

  if (response.status === 401) {
    throw new BiletimgoError("auth");
  }

  if (response.status === 403) {
    // Yanıt JSON değil HTML ise genellikle bir güvenlik katmanı (WAF/CDN) isteği engellemiştir.
    const contentType = response.headers.get("content-type") ?? "";
    console.error("biletimgo_403", await describeBlock(response));
    throw new BiletimgoError(
      contentType.includes("html") ? "forbidden_html" : "forbidden",
    );
  }

  if (response.status >= 500) {
    throw new BiletimgoError("server");
  }

  if (!response.ok) {
    throw new BiletimgoError("http");
  }

  if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) {
    throw new BiletimgoError("too_large");
  }

  let text: string;

  try {
    text = await response.text();
  } catch {
    throw new BiletimgoError("network");
  }

  if (text.length > MAX_BYTES) {
    throw new BiletimgoError("too_large");
  }

  let body: unknown;

  try {
    body = JSON.parse(text);
  } catch {
    throw new BiletimgoError("invalid_response");
  }

  const data = (body as { data?: unknown } | null)?.data;

  if (!Array.isArray(data)) {
    throw new BiletimgoError("invalid_response");
  }

  return data;
}