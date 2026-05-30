import { refreshSession } from "@/server/store";
import { json, fail, SESSION_COOKIE } from "@/server/http";
import { cookies } from "next/headers";
import { StoreError } from "@/server/store";

export async function POST() {
  try {
    const refresh = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!refresh) throw new StoreError(401, "INVALID_REFRESH", "No session");
    const { accessToken, user } = refreshSession(refresh);
    return json({ accessToken, user });
  } catch (e) {
    return fail(e);
  }
}
