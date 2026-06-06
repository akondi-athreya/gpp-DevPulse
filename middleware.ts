import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "./lib/rate-limit";

export { checkRateLimit };

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Rate limiting check for API routes under /api
  if (path.startsWith("/api")) {
    let ip = (req as any).ip || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    const rateLimit = await checkRateLimit(ip, path);
    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "rate_limit_exceeded", retryAfter: 60 }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // 2. Protect dashboard routes and redirect unauthenticated users to /login
  const protectedPrefixes = ["/feed", "/submit", "/profile", "/review", "/leaderboard"];
  const isProtected = protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );

  if (isProtected) {
    const secureCookie = process.env.NODE_ENV === "production" || req.headers.get("x-forwarded-proto") === "https";
    const sessionToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
      secureCookie,
    });
    if (!sessionToken) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed",
    "/feed/:path*",
    "/submit",
    "/submit/:path*",
    "/profile",
    "/profile/:path*",
    "/review",
    "/review/:path*",
    "/leaderboard",
    "/leaderboard/:path*",
    "/api/:path*",
  ],
};
