import { logout } from "@/server/store";
import { json, fail, clearSessionCookie, SESSION_COOKIE } from "@/server/http";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    const refresh = (await cookies()).get(SESSION_COOKIE)?.value;
    logout(bearer, refresh);
    const res = json({ ok: true });
    clearSessionCookie(res);
    return res;
  } catch (e) {
    return fail(e);
  }
}
