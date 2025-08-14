import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static/public assets
  if (
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

  // Brak sesji
  if (!token) {
    if (pathname === "/logowanie" || publicPaths.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }

  // 🔹 Jeśli świeżo po zapisie — przepuść
  if (request.cookies.get("justCompletedProfile")) {
    return NextResponse.next();
  }

  // 🔹 Pobierz świeży stan profilu z API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const profileRes = await fetch(`${baseUrl}/api/user/profile-complete`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  let profileComplete = false;
  if (profileRes.ok) {
    const data = await profileRes.json();
    profileComplete = !!data.complete;
  }

  // Profil kompletny → jeśli wchodzi na logowanie, przekieruj do centrum zdrowia
  if (profileComplete && pathname === "/logowanie") {
    return NextResponse.redirect(new URL("/centrum-zdrowia", request.url));
  }

  // Profil niekompletny → przekieruj na rejestracja-dodatkowa
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
