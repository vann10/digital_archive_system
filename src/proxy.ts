// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

// Routes yang boleh diakses tanpa login
const PUBLIC_ROUTES = ["/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Izinkan akses ke static files dan API Next.js internal
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Cek session cookie
  const sessionCookie = request.cookies.get("user_session");

  if (!sessionCookie) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie.value);

    if (!session?.id || !session?.username || !session?.role) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
