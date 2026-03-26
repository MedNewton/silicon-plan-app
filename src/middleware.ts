// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/",              // desktop home
  "/team(.*)",      // team and team/mobile
  "/workspaces(.*)", // all workspace routes (including pitch-deck)
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;
      const signInUrl = new URL("/auth", req.url);
      signInUrl.searchParams.set("redirect_url", redirectUrl);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Clerk recommended matcher: run on all app/API routes, skip static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
