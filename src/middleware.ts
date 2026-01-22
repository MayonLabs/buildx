import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // Protected routes
    const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");
    const isAuthRoute = nextUrl.pathname === "/login";

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Redirect to dashboard if already logged in and accessing auth routes
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
