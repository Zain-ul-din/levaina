import { NextResponse, type NextRequest } from "next/server";
import { updateSession, withSessionCookies } from "@/lib/auth/proxy-session";

/** Pages anyone can open. Everything else needs a signed-in user. */
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Already signed in: the sign-in screen has nothing to offer.
  if (isSignedIn && pathname === "/login") {
    return withSessionCookies(response, NextResponse.redirect(new URL("/", request.url)));
  }
  if (isSignedIn || PUBLIC_PATHS.includes(pathname)) return response;

  // Signed out: APIs answer 401; pages go to the sign-in screen.
  if (pathname.startsWith("/api/")) {
    return withSessionCookies(response, NextResponse.json({ error: "Not signed in" }, { status: 401 }));
  }
  return withSessionCookies(response, NextResponse.redirect(new URL("/login", request.url)));
}

export const config = {
  // Skip static files, images and the generated icons: they need no session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
