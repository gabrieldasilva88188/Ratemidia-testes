import { ExternalApiError } from "./types";

interface FetchJsonOptions {
  headers?: Record<string, string>;
  /** Corpo JSON: se informado, a requisição vira POST. */
  body?: unknown;
  /** Segundos de cache do Next (Data Cache). */
  revalidate?: number;
  /** Tentativas extras quando a API responde 429 (rate limit). */
  retries?: number;
  timeoutMs?: number;
}

export const RETRY_DELAY_MS = 1100; // Jikan: limite de 3 req/s e 60 req/min

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET/POST JSON com timeout e uma nova tentativa em 429 ou falha de rede. Lança ExternalApiError em falhas. */
export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { headers, body, revalidate = 3600, retries = 1, timeoutMs = 15000 } = opts;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: body === undefined ? "GET" : "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
        next: { revalidate },
      });
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      const cause = (e as { cause?: { code?: string; message?: string } }).cause;
      console.error(`[external] ${new URL(url).host}: ${timedOut ? "timeout" : (cause?.code ?? cause?.message ?? String(e))}`);
      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new ExternalApiError(
        timedOut
          ? "A API externa demorou demais para responder. Tente novamente."
          : "Não foi possível conectar à API externa. Verifique sua conexão, firewall ou VPN.",
      );
    }

    if (res.status === 429 && attempt < retries) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || RETRY_DELAY_MS;
      await sleep(Math.min(wait, 5000));
      continue;
    }
    if (!res.ok) {
      throw new ExternalApiError(`A API externa respondeu ${res.status}.`, res.status);
    }
    return (await res.json()) as T;
  }
}
