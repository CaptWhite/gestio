import { NextResponse } from "next/server"

export function middleware(request: any) {
  const pathname = request.nextUrl.pathname
  const cookieHeader = request.headers.get("cookie") || ""
  
  const hasSessionCookie = cookieHeader.includes("next-auth.session-token")
  
  // Allow login, api/auth, and _next paths
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.includes("favicon") || pathname.includes("logo")) {
    return NextResponse.next()
  }
  
  // Protect root path (without trailing slash)
  if (pathname === "/") {
    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  
  // Protect other routes
  if ((pathname === "/customers" || pathname === "/tasks" || pathname === "/settings" || pathname === "/inscriptions") && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}