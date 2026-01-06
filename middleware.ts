import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    // Check for session token (v5) or next-auth token (legacy/v4 compat)
    // Secure vs Non-secure depends on env (prod uses __Secure-)
    const sessionToken = request.cookies.get("authjs.session-token")?.value ||
        request.cookies.get("__Secure-authjs.session-token")?.value ||
        request.cookies.get("next-auth.session-token")?.value ||
        request.cookies.get("__Secure-next-auth.session-token")?.value

    const { pathname } = request.nextUrl

    // Define protected paths
    const isDashboardPath = pathname.startsWith("/dashboard")

    // Strict Auth Redirects
    // 1. Protected: /dashboard -> Redirect to /login if no session
    if (isDashboardPath && !sessionToken) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(url)
    }

    // 2. Public (Guest Only): /login, /signup, / (Home) -> Redirect to /dashboard if logged in
    const isGuestOnlyPath = pathname === "/" || pathname === "/login" || pathname === "/signup"

    // Check if we are in a correction loop (e.g. Dashboard sent us back due to invalid session)
    const isSessionError = request.nextUrl.searchParams.get("error") === "SessionExpired"

    if (isGuestOnlyPath && sessionToken && !isSessionError) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
