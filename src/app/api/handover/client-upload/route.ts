import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_BYTES, MAX_FILE_MB } from "@/lib/uploadLimits";

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

// POST — PUBLIC endpoint: upload ONE inspection photo from the client's share
// link. No login; access is gated by the per-document share token (the same
// token that authorizes submitting the acceptance). One image per request keeps
// the body well under Vercel's limit; images are compressed in the browser too.
export async function POST(req: NextRequest) {
  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const id = formData.get("id");
    const token = formData.get("token");
    const value = formData.get("file");

    if (typeof id !== "string" || typeof token !== "string" || !id || !token) {
      return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
    }
    if (!value || typeof value === "string" || !("arrayBuffer" in value)) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    // Authorize via the document's share token before touching Drive.
    const { getHandover, uploadFileFromBytes } = await import("@/lib/gdrive");
    const existing = await getHandover(id);
    if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
    if (existing.data.shareToken !== token) {
      return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 403 });
    }

    const f = value as File;
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน " + MAX_FILE_MB + "MB" }, { status: 413 });
    }
    if (f.size === 0) {
      return NextResponse.json({ error: "ไฟล์ว่างเปล่า" }, { status: 400 });
    }

    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const rnd = Math.random().toString(36).slice(2, 10);
    // The "handover_" prefix is what lets the public photo proxy serve this file.
    const fileName = "handover_" + Date.now().toString(36) + "_" + rnd + "." + ext;

    const bytes = new Uint8Array(await f.arrayBuffer());
    const fileId = await uploadFileFromBytes(fileName, bytes, f.type || "image/jpeg");

    return NextResponse.json({ ok: true, fileId });
  } catch (err) {
    console.error("[MW] Handover client upload error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
