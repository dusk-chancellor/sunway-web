import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { StoreError, resolveUserId } from "./store";
import { ulid } from "@/lib/utils/ids";

export const SESSION_COOKIE = "sunway_session"; // httpOnly refresh token
export const CART_COOKIE = "sunway_cart"; // httpOnly guest cart token

const isProd = process.env.NODE_ENV === "production";
const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
};

/** Resolve the signed-in user id from the Bearer token or the session cookie. */
export async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const fromBearer = resolveUserId(auth.slice(7));
    if (fromBearer) return fromBearer;
  }
  const jar = await cookies();
  const refresh = jar.get(SESSION_COOKIE)?.value;
  return resolveUserId(refresh);
}

/** Stable cart key: the user id if logged in, otherwise a guest cart token. */
export async function getCartKey(req: Request): Promise<{ key: string; userId: string | null; setCookie?: string }> {
  const userId = await getUserId(req);
  if (userId) return { key: userId, userId };
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) return { key: existing, userId: null };
  const token = `cart_${ulid()}`;
  return { key: token, userId: null, setCookie: token };
}

export function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(err: unknown): NextResponse {
  const requestId = ulid();
  if (err instanceof StoreError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, requestId, details: err.details } },
      { status: err.status, headers: { "X-Request-ID": requestId } },
    );
  }
  // eslint-disable-next-line no-console
  console.error("[api] unhandled", requestId, err);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong", requestId } },
    { status: 500, headers: { "X-Request-ID": requestId } },
  );
}

export function setSessionCookie(res: NextResponse, refreshToken: string): void {
  res.cookies.set(SESSION_COOKIE, refreshToken, { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
}
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { ...baseCookie, maxAge: 0 });
}
export function setCartCookie(res: NextResponse, token: string): void {
  res.cookies.set(CART_COOKIE, token, { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
}
export function clearCartCookie(res: NextResponse): void {
  res.cookies.set(CART_COOKIE, "", { ...baseCookie, maxAge: 0 });
}
