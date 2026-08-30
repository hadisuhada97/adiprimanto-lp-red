import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "admin_access_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(TOKEN_COOKIE);

  if (pathname === "/admin/login" && hasToken) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasToken) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
