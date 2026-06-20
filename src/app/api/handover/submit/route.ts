import { NextRequest, NextResponse } from "next/server";
import { driveErrorMessage } from "@/lib/driveError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isGoogleDriveReady(): boolean {
  return (
    (process.env.GOOGLE_CLIENT_ID || "").length > 5 &&
    (process.env.GOOGLE_CLIENT_SECRET || "").length > 5 &&
    (process.env.GOOGLE_REFRESH_TOKEN || "").length > 10 &&
    (process.env.GOOGLE_DRIVE_FOLDER_ID || "").length > 5
  );
}

// POST — PUBLIC endpoint: the client submits their acceptance (ticks + signature)
// via the share link. No login; access is gated by the per-document share token.
export async function POST(req: NextRequest) {
  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = body.id;
    const token = body.token;

    if (!id || typeof id !== "string" || !token || typeof token !== "string") {
      return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
    }

    const { getHandover, updateJsonInDrive } = await import("@/lib/gdrive");
    const existing = await getHandover(id);
    if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

    if (existing.data.shareToken !== token) {
      return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 403 });
    }

    const result = body.clientResult === "pass" || body.clientResult === "fail" ? body.clientResult : "";
    const clientChecked =
      body.clientChecked && typeof body.clientChecked === "object" ? body.clientChecked : {};

    // Only the client-controlled fields are written back; everything the admin
    // authored is left untouched.
    const merged = {
      ...existing.data,
      clientName: String(body.clientName ?? ""),
      clientResult: result,
      clientReason: String(body.clientReason ?? ""),
      clientChecked,
      clientNote: String(body.clientNote ?? ""),
      clientSignature: String(body.clientSignature ?? ""),
      clientSignDate: String(body.clientSignDate ?? ""),
      clientSubmittedAt: new Date().toISOString(),
      status: result === "fail" ? "rejected" : "accepted",
      updatedAt: new Date().toISOString(),
    };

    await updateJsonInDrive(existing.driveFileId, merged);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MW] Handover submit error:", err);
    return NextResponse.json({ error: driveErrorMessage(err) }, { status: 500 });
  }
}
