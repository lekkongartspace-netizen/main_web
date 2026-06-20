import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./lib/session";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("mw_session");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const data = session ? await verifySession(session.value) : null;
    if (!data || data.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
