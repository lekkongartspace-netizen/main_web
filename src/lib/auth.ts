import { cookies } from "next/headers";
import { signSession, verifySession, type Session } from "./session";
import type { Permission } from "./permissions";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("mw_session");
  if (!session) return null;
  return verifySession(session.value);
}

// Convenience guard for route handlers: true only when the current session
// holds the given permission.
export async function requirePermission(perm: Permission): Promise<boolean> {
  const session = await getSession();
  return !!session && session.perms.includes(perm);
}

export async function setSession(name: string, perms: Permission[]): Promise<void> {
  const cookieStore = await cookies();
  const value = await signSession({ name, perms });
  cookieStore.set("mw_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("mw_session");
}
