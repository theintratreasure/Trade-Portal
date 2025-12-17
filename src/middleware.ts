import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔐 Read auth from cookie
  const token = req.cookies.get("accessToken")?.value;

  // ❌ Block dashboard without login
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // 🔁 Logged-in user should not see login/signup
  if (
    (pathname === "/login" || pathname === "/signup") &&
    token
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};
