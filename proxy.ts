import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      const originHost = safeHost(origin);
      const requestHost = request.headers.get("host");
      if (!originHost || !requestHost || originHost !== requestHost) {
        return NextResponse.json({ error: "非法请求来源" }, { status: 403 });
      }
    }
  }

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

function safeHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cart/:path*", "/checkout/:path*", "/orders/:path*", "/api/:path*"]
};
