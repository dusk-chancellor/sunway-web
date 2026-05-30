import { verifyOtp } from "@/server/store";
import { json, fail, setSessionCookie } from "@/server/http";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone: string; code: string; fullName?: string };
    const { accessToken, refreshToken, user } = verifyOtp(body.phone, body.code, body.fullName);
    const res = json({ accessToken, user });
    setSessionCookie(res, refreshToken); // refresh token stays httpOnly, never in JS
    return res;
  } catch (e) {
    return fail(e);
  }
}
