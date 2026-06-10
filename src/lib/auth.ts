import { cookies } from "next/headers";

interface Session {
  name: string;
  role: "admin" | "user";
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("mw_session");
  if (!session) return null;
  try {
    return JSON.parse(session.value) as Session;
  } catch {
    return null;
  }
}

export async function setSession(name: string, role: "admin" | "user"): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("mw_session", JSON.stringify({ name, role }), {
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
