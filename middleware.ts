import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/logowanie", "/rejestracja"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const cookieKey =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || "",
    cookieName: cookieKey,
  });

  console.log("🔐 Token w middleware:", token);

  if (!token) {
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }

  const profileComplete = token.profileComplete;

  if (!profileComplete && pathname !== "/rejestracja-dodatkowa") {
    return NextResponse.redirect(
      new URL("/rejestracja-dodatkowa", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|api/|static/|favicon.ico|images/|icons/|fonts/|media/).*)",
  ],
};
