import { NextRequest, NextResponse } from "next/server";
import { verifyPin } from "@/lib/github";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";

// Basic in-memory brute-force throttle. Per-instance only (Vercel may run
// several), but it meaningfully slows down PIN guessing on a given instance.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;
const attempts = new Map<string, { count: number; first: number }>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count++;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429 }
      );
    }

    const { pin } = await req.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "กรุณากรอก PIN" }, { status: 400 });
    }

    const user = await verifyPin(pin);

    if (!user) {
      return NextResponse.json({ error: "PIN ไม่ถูกต้อง" }, { status: 401 });
    }

    // Successful login clears the throttle for this IP.
    attempts.delete(ip);

    await setSession(user.name, user.role);

    return NextResponse.json({ name: user.name, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
