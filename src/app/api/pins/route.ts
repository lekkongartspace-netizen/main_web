import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getPins, savePins } from "@/lib/github";
import { resolvePermissions, sanitizePermissions } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requirePermission("managePins"))) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    // Migrate legacy role-only entries to explicit permissions on the way out so
    // the editor always works with the current shape.
    const pins = await getPins();
    return NextResponse.json(
      pins.map((p) => ({ name: p.name, pin: p.pin, permissions: resolvePermissions(p) }))
    );
  } catch (err) {
    console.error("Get pins error:", err);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requirePermission("managePins"))) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const raw = await req.json();

    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const pins = [];
    for (const p of raw) {
      if (!p || !p.name || !p.pin) {
        return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
      }
      if (!/^\d{6}$/.test(p.pin)) {
        return NextResponse.json({ error: "PIN ต้องเป็นตัวเลข 6 หลัก" }, { status: 400 });
      }
      pins.push({ name: String(p.name), pin: String(p.pin), permissions: sanitizePermissions(p.permissions) });
    }

    // Safeguard against locking everyone out: at least one PIN must be able to
    // manage PINs, otherwise no one could ever edit this list again.
    if (!pins.some((p) => p.permissions.includes("managePins"))) {
      return NextResponse.json(
        { error: "ต้องมีอย่างน้อย 1 PIN ที่มีสิทธิ์ “จัดการ PIN”" },
        { status: 400 }
      );
    }

    await savePins(pins);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Save pins error:", err);
    return NextResponse.json({ error: "ไม่สามารถบันทึกได้" }, { status: 500 });
  }
}
