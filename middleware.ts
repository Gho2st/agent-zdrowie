import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/logowanie", "/rejestracja"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zezwól na statyczne zasoby i API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts")
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

  // Brak tokena - przekieruj na logowanie
  if (!token) {
    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }

  // Pobierz status uzupełnienia profilu
  const profileComplete = token?.profileComplete === true;

  // Jeśli profil uzupełniony, a użytkownik na stronie rejestracji - przekieruj
  if (profileComplete && pathname === "/rejestracja-dodatkowa") {
    return NextResponse.redirect(new URL("/profil", request.url));
  }

  // Jeśli profil nieuzupełniony i nie jest na stronie rejestracji - przekieruj
  if (!profileComplete && pathname !== "/rejestracja-dodatkowa") {
    // Dodaj flagę do URL, aby uniknąć pętli przekierowań
    const url = new URL("/rejestracja-dodatkowa", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/auth|images|fonts|media|icons).*)",
  ],
};
