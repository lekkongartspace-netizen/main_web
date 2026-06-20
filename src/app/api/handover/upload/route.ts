import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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

// POST — upload ONE handover photo and return its Drive fileId. Uploading one
// image per request keeps every request comfortably under Vercel's body limit;
// images are also compressed in the browser before reaching here. Admin only.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const value = formData.get("file");
    if (!value || typeof value === "string" || !("arrayBuffer" in value)) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
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
    const { uploadFileFromBytes } = await import("@/lib/gdrive");
    const fileId = await uploadFileFromBytes(fileName, bytes, f.type || "image/jpeg");

    return NextResponse.json({ ok: true, fileId });
  } catch (err) {
    console.error("[MW] Handover upload error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
