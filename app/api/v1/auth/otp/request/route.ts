import { requestOtp } from "@/server/store";
import { json, fail } from "@/server/http";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone: string; purpose?: string };
    const result = requestOtp(body.phone, body.purpose ?? "login");
    // In production the devCode is never returned; here it eases local testing.
    const expose = process.env.NODE_ENV !== "production";
    return json({ ok: true, ...(expose ? { devCode: result.devCode } : {}) });
  } catch (e) {
    return fail(e);
  }
}
