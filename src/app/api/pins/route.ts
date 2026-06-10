import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPins, savePins } from "@/lib/github";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const pins = await getPins();
    return NextResponse.json(pins);
  } catch (err) {
    console.error("Get pins error:", err);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const pins = await req.json();

    if (!Array.isArray(pins)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    for (const p of pins) {
      if (!p.name || !p.pin || !p.role) {
        return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
      }
      if (!/^\d{6}$/.test(p.pin)) {
        return NextResponse.json({ error: "PIN ต้องเป็นตัวเลข 6 หลัก" }, { status: 400 });
      }
    }

    await savePins(pins);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Save pins error:", err);
    return NextResponse.json({ error: "ไม่สามารถบันทึกได้" }, { status: 500 });
  }
}
