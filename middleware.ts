import { NextResponse } from "next/server"

export function middleware(request: any) {
  const pathname = request.nextUrl.pathname
  const cookieHeader = request.headers.get("cookie") || ""
  
  const hasSessionCookie = cookieHeader.includes("next-auth.session-token")
  
  // Allow static assets, API, and auth routes
  const isStaticAsset = 
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/data/") ||
    pathname.startsWith("/_next/image/") ||
    pathname.includes("/gestio/_next/")

  const isAPI = 
    pathname.startsWith("/api/") || 
    pathname.startsWith("/gestio/api/")

  const isAuth = 
    pathname.includes("/api/auth/") || 
    pathname === "/login" || 
    pathname === "/gestio/login"

  const isPublic = 
    pathname.includes("favicon") || 
    pathname.includes("logo")

  if (isStaticAsset || isAPI || isAuth || isPublic) {
    return NextResponse.next()
  }
  
  // Protect root /gestio path (without trailing slash)
  if (pathname === "/gestio" || (pathname.startsWith("/gestio/") && !pathname.includes("login"))) {
    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL("/gestio/login", request.url))
    }
  }
  
  // Protect root paths
  if ((pathname === "/" || pathname === "/customers" || pathname === "/tasks" || pathname === "/settings" || pathname === "/inscriptions") && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/gestio/login", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!favicon.ico).*)"]
}