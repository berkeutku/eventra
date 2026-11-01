// biletimGO API istemcisi. Token yalnızca sunucuda kullanılır ve istek adresi (token içerir)
// hiçbir hata mesajına, günlüğe ya da çıktıya yazılmaz: yalnızca bir hata KODU fırlatılır.

const ENDPOINT = "https://www.biletimgo.com/api/v1/etkinlik-listesi";
const MAX_BYTES = 8_000_000;
const TIMEOUT_MS = 30_000;

export type FetchLike = typeof fetch;

export type FetchFailure =
  | "auth"
  | "forbidden"
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
        headers: { Accept: "application/json" },
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
    throw new BiletimgoError("forbidden");
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