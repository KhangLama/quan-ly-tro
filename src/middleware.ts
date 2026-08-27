import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAdminPassword } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, internal Next.js files, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") || // files with extensions (e.g. .ico, .png, .svg)
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = getAdminPassword();
  const isAuthenticated = await verifySessionToken(token, secret);

  const isLoginPage = pathname === "/login";
  const isPublicApiAuth = pathname === "/api/auth/login" || pathname === "/api/auth/logout";

  // If already authenticated and accessing login page, redirect to home / dashboard
  if (isAuthenticated && isLoginPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Allow access to login page or public auth API
  if (isLoginPage || isPublicApiAuth) {
    return NextResponse.next();
  }

  // If not authenticated:
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập hoặc phiên làm việc đã hết hạn" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    // Optional: save return url if needed
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
