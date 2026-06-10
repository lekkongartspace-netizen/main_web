import { NextRequest, NextResponse } from "next/server";
import { verifyPin } from "@/lib/github";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "กรุณากรอก PIN" }, { status: 400 });
    }

    const user = await verifyPin(pin);

    if (!user) {
      return NextResponse.json({ error: "PIN ไม่ถูกต้อง" }, { status: 401 });
    }

    await setSession(user.name, user.role);

    return NextResponse.json({ name: user.name, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
