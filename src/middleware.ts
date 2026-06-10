import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isUnsubscribe = req.nextUrl.pathname.startsWith("/unsubscribe") || req.nextUrl.pathname.startsWith("/api/unsubscribe");

  if (isApiAuth || isUnsubscribe) return NextResponse.next();

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth?.user?.role;
  const isInstaller = role === "INSTALLER";

  if (isLoggedIn && isLoginPage) {
    const landing = isInstaller ? "/projects" : "/clients";
    return NextResponse.redirect(new URL(landing, req.url));
  }

  // INSTALLER scope: only /projects/* and /profile (+ public /api/auth handled above)
  if (isLoggedIn && isInstaller) {
    const p = req.nextUrl.pathname;
    const allowed =
      p.startsWith("/projects") ||
      p.startsWith("/profile") ||
      p.startsWith("/api/inbox") ||
      p === "/";
    if (!allowed) {
      return NextResponse.redirect(new URL("/projects", req.url));
    }
    return NextResponse.next();
  }

  // /projects is hidden from ADMIN/MANAGER/TECHNICIAN/VIEWER — only INSTALLERs use it.
  if (
    isLoggedIn &&
    req.nextUrl.pathname.startsWith("/projects") &&
    !isInstaller
  ) {
    return NextResponse.redirect(new URL("/clients", req.url));
  }

  // Admin-only routes
  const adminOnlyPaths = ["/users", "/campaigns", "/settings"];
  const isAdminRoute = adminOnlyPaths.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isLoggedIn && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/clients", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|manifest.webmanifest|icons/|apple-touch-icon).*)",
  ],
};
