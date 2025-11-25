import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/register",
        "/auth/verify",
        "/auth/verify-email",
        "/auth/forgot-password",
        "/auth/reset-password",
    ];

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Allow access to public routes and static files
    if (isPublicRoute || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Check for authentication token
    const token = request.cookies.get("accessToken")?.value;

    // If no token, redirect to register page
    if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/register";
        // Store the intended destination for post-login redirect
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
