import { tokenStore } from "../token";
import { tryRefresh } from "../client";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export interface Media {
  url: string;
  thumb_url: string;
  medium_url: string;
}

// Fires the multipart POST with the current bearer token. Kept separate so we
// can replay it after a token refresh (FormData is single-use, so the caller
// rebuilds it per attempt).
function post(file: File): Promise<Response> {
  const body = new FormData();
  body.append("file", file);
  const token = tokenStore.get();
  return fetch(`${BASE}/admin/uploads`, {
    method: "POST",
    body,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * Uploads one image to the admin uploads endpoint. Multipart, so it bypasses
 * the JSON apiFetch client — but it mirrors that client's one-shot
 * refresh-and-retry on 401 so an expired 15-minute access token is re-minted
 * from the refresh cookie instead of surfacing as a spurious failure.
 * Returns the stored URL (served by the Go backend under /uploads/...).
 */
export async function uploadImage(file: File): Promise<Media> {
  let res = await post(file);
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) res = await post(file);
  }
  if (!res.ok) {
    let message = "Upload failed";
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data.error?.message) message = data.error.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return (await res.json()) as Media;
}
