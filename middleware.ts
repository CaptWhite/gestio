import { NextResponse } from "next/server"

export function middleware(request: any) {
  const pathname = request.nextUrl.pathname
  const cookieHeader = request.headers.get("cookie") || ""
  
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  const hasNextAuthCookie = cookieHeader.includes("next-auth.session-token")
  const hasSimpleAuthCookie = cookieHeader.includes("session-token")
  
  const isAuthenticated = hasNextAuthCookie || hasSimpleAuthCookie;
  
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.includes("favicon") || pathname.includes("logo")) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith("/api/debug/")) {
    return NextResponse.next()
  }
  
  if (!authEnabled) {
    return NextResponse.next()
  }
  
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  
  if ((pathname === "/customers" || pathname === "/tasks" || pathname === "/settings" || pathname === "/inscriptions") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/debug|_next/static|_next/image|favicon.ico).*)"]
}