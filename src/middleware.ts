import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./lib/session";
import type { Permission } from "./lib/permissions";

// Which permission each /admin area requires. Most-specific prefix first so
// e.g. /admin/handover/edit is matched before /admin/handover.
const RULES: { prefix: string; perm: Permission }[] = [
  { prefix: "/admin/handover/edit", perm: "createHandover" },
  { prefix: "/admin/handover", perm: "viewHandover" },
  { prefix: "/admin/applications", perm: "viewApplications" },
  { prefix: "/admin", perm: "managePins" },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const session = request.cookies.get("mw_session");
  const data = session ? await verifySession(session.value) : null;
  if (!data) return NextResponse.redirect(new URL("/", request.url));

  const rule = RULES.find((r) => pathname.startsWith(r.prefix));
  const perm = rule?.perm ?? "managePins";
  if (!data.perms.includes(perm)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
