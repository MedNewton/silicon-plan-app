// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, userAgent } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/",           // desktop home
  "/mobile(.*)", // mobile home
  "/team(.*)",   // team and team/mobile
]);

const mobileRewrittenPaths = ["/", "/team"];

export default clerkMiddleware(async (auth, req) => {
  // 1) Auth gate: protect selected routes
  if (isProtectedRoute(req)) {
    await auth.protect(); // will redirect to your Clerk sign-in URL (set to /auth)
  }

  // 2) Mobile rewrite (your old logic)
  const { pathname } = req.nextUrl;

  if (mobileRewrittenPaths.includes(pathname)) {
    const ua = userAgent(req);
    const deviceType = ua.device.type ?? "desktop";
    const isMobile = deviceType === "mobile" || deviceType === "tablet";

    if (isMobile) {
      const url = req.nextUrl.clone();

      if (pathname === "/") {
        url.pathname = "/mobile";
      } else {
        url.pathname = `${pathname}/mobile`;
      }

      return NextResponse.rewrite(url);
    }
  }

  // 3) Default: continue normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Clerk recommended matcher: run on all app/API routes, skip static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
