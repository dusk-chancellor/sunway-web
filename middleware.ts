import { NextResponse, type NextRequest } from "next/server";

// Lightweight edge gate. The presence of the httpOnly session cookie is a cheap
// signal; full role checks happen server-side in the API (requireAdmin) and in
// client layouts. Routes that require auth redirect guests to the right place.
// Matches the Go backend's refresh cookie (set on login). Same registrable
// host (localhost) so it is visible to the Next middleware on navigation.
const SESSION_COOKIE = "sw_refresh";

const PROTECTED_PREFIXES = ["/checkout", "/account"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // Storefront protected routes → redirect to login with ?next=
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Admin area: everything except the admin login requires a session cookie.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/account/:path*", "/admin/:path*"],
};
