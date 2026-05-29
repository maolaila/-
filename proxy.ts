import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (
    (pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders")) &&
    !hasSession
  ) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cart/:path*", "/checkout/:path*", "/orders/:path*"]
};
