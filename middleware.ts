import { NextResponse } from "next/server"

export function middleware(request: any) {
  const pathname = request.nextUrl.pathname
  const cookieHeader = request.headers.get("cookie") || ""
  const internalSecret = request.headers.get("x-internal-secret") || ""
  
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  const isValidInternalToken = internalSecret && internalSecret === process.env.INTERNAL_API_SECRET;
  
  const hasNextAuthCookie = cookieHeader.includes("next-auth.session-token")
  const hasSimpleAuthCookie = cookieHeader.includes("session-token")
  
  const isAuthenticated = hasNextAuthCookie || hasSimpleAuthCookie || isValidInternalToken;
  
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.includes("favicon") || pathname.includes("logo")) {
    return NextResponse.next()
  }
  
  if (pathname.startsWith("/api/debug/")) {
    return NextResponse.next()
  }
  
  if (!authEnabled || isValidInternalToken) {
    return NextResponse.next()
  }
  
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  
  if ((pathname === "/customers" || pathname === "/tasks" || pathname === "/settings" || pathname === "/inscriptions" || pathname === "/curs-iniciacio") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/debug|_next/static|_next/image|favicon.ico).*)"]
}