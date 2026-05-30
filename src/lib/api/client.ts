import { tokenStore } from "./token";
import { ulid } from "@/lib/utils/ids";
import { apiErrorSchema } from "@/lib/validation/schemas";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export class ServerError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return false;
        const data = (await r.json()) as { accessToken: string };
        tokenStore.set(data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  idempotencyKey?: string;
  /** set false to skip the one-shot refresh+retry (used by auth calls) */
  retryOnAuthFail?: boolean;
}

async function raw(path: string, opts: ApiFetchOptions): Promise<Response> {
  const headers = new Headers(opts.headers);
  headers.set("Accept", "application/json");
  if (opts.body !== undefined) headers.set("Content-Type", "application/json");
  headers.set("X-Request-ID", ulid());
  if (opts.idempotencyKey) headers.set("Idempotency-Key", opts.idempotencyKey);
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    credentials: "include",
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const retry = opts.retryOnAuthFail ?? true;
  let res = await raw(path, opts);

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) res = await raw(path, opts);
  }

  if (!res.ok) {
    let code = "ERROR";
    let message = res.statusText;
    let requestId: string | undefined;
    let details: unknown;
    try {
      const parsed = apiErrorSchema.safeParse(await res.json());
      if (parsed.success) {
        code = parsed.data.error.code;
        message = parsed.data.error.message;
        requestId = parsed.data.error.requestId;
        details = parsed.data.error.details;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ServerError(res.status, code, message, requestId, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
