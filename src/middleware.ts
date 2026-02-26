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

  if (isLoggedIn && isLoginPage) {
    const home = req.auth?.user?.role === "ADMIN" ? "/projects" : "/clients";
    return NextResponse.redirect(new URL(home, req.url));
  }

  // Admin-only routes
  const adminOnlyPaths = ["/users", "/campaigns", "/settings", "/projects"];
  const isAdminRoute = adminOnlyPaths.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isLoggedIn && isAdminRoute && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/clients", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
