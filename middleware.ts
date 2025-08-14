import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/"];
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets
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
    // pozwól na stronę logowania i stronę główną
    if (pathname === "/logowanie" || publicPaths.includes(pathname)) {
      return NextResponse.next();
    }
    // wszystko inne → logowanie
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }

  // Zalogowany i profil kompletny → blokujemy wejście na /logowanie
  if (token.profileComplete === true && pathname === "/logowanie") {
    return NextResponse.redirect(new URL("/centrum-zdrowia", request.url));
  }

  // Zalogowany i profil niekompletny → przekieruj na rejestracja-dodatkowa
  if (
    token.profileComplete === false &&
    pathname !== "/rejestracja-dodatkowa"
  ) {
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
