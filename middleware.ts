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

  const cookieName =
    request.nextUrl.protocol === "https:"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName,
  });

  console.log("🔐 Token w middleware:", token);
  console.log("🔍 request.cookies.getAll():", request.cookies.getAll());

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
  runtime: "nodejs",
};
