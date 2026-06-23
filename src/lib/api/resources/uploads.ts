import { tokenStore } from "../token";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export interface Media {
  url: string;
  thumb_url: string;
  medium_url: string;
}

/**
 * Uploads one image to the admin uploads endpoint. Multipart, so it bypasses
 * the JSON apiFetch client but reuses its bearer token + cookie credentials.
 * Returns the stored URL (served by the Go backend under /uploads/...).
 */
export async function uploadImage(file: File): Promise<Media> {
  const body = new FormData();
  body.append("file", file);
  const token = tokenStore.get();
  const res = await fetch(`${BASE}/admin/uploads`, {
    method: "POST",
    body,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
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
