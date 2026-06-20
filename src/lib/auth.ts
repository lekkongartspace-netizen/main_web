import { cookies } from "next/headers";
import { signSession, verifySession, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("mw_session");
  if (!session) return null;
  return verifySession(session.value);
}

export async function setSession(name: string, role: "admin" | "user"): Promise<void> {
  const cookieStore = await cookies();
  const value = await signSession({ name, role });
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
