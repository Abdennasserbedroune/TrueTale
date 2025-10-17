import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const { nextUrl, auth: session } = request;
  const pathname = nextUrl.pathname;

  const loginUrl = new URL("/login", nextUrl.origin);
  const onboardingUrl = new URL("/profile/onboarding", nextUrl.origin);
  const dashboardUrl = new URL("/dashboard", nextUrl.origin);

  const isProfileRoute = pathname.startsWith("/profile");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!session && (isProfileRoute || isDashboardRoute)) {
    return NextResponse.redirect(loginUrl);
  }

  if (session && !session.user.profileComplete && (isDashboardRoute || pathname === "/profile/edit")) {
    if (pathname !== "/profile/onboarding") {
      return NextResponse.redirect(onboardingUrl);
    }
  }

  if (session && session.user.profileComplete && pathname === "/profile/onboarding") {
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
