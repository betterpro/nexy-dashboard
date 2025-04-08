import { NextResponse } from "next/server";
import { ROUTE_ACCESS } from "./components/context/roles";

export function middleware(request) {
  // Get the pathname from the request
  const path = request.nextUrl.pathname;

  // Get the user's role from the session/token
  // This is a placeholder - you'll need to implement the actual auth check
  const userRole = request.cookies.get("userRole")?.value;

  // Check if the route requires authentication
  const allowedRoles = ROUTE_ACCESS[path];

  if (allowedRoles) {
    // If no user role or user doesn't have access, redirect to login
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/admin/:path*",
    "/franchisee/:path*",
    "/partner/:path*",
    "/profile",
    "/settings",
  ],
};
