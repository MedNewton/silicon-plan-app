import { NextResponse, type NextRequest, userAgent } from "next/server";

export function middleware(req: NextRequest): NextResponse {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const ua = userAgent(req);
  const deviceType = ua.device.type ?? "desktop";
  const isMobile = deviceType === "mobile" || deviceType === "tablet";

  const mobileRewrittenPaths = ["/", "/team"];

  if (isMobile && mobileRewrittenPaths.includes(pathname)) {
    const url = nextUrl.clone();

    if (pathname === "/") {
      url.pathname = "/mobile";
    } else {
      url.pathname = `${pathname}/mobile`;
    }

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/team"],
};
