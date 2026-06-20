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

// GET — PUBLIC lookup by project code. Customers open their handover document by
// typing the project code (access is by code only, as configured). Returns the
// document id + share token so the client can be redirected to the doc page.
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") || "").trim();
  if (!code) return NextResponse.json({ error: "กรุณากรอกรหัสโครงการ" }, { status: 400 });

  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "ระบบยังไม่พร้อมใช้งาน" }, { status: 503 });
  }

  try {
    const { listHandovers } = await import("@/lib/gdrive");
    const all = (await listHandovers()) as Array<{ id?: string; projectCode?: string; shareToken?: string }>;
    const match = all.find((d) => (d.projectCode || "").trim().toLowerCase() === code.toLowerCase());

    if (!match || !match.id || !match.shareToken) {
      return NextResponse.json({ error: "ไม่พบโครงการที่มีรหัสนี้" }, { status: 404 });
    }
    return NextResponse.json({ id: match.id, token: match.shareToken });
  } catch (err) {
    console.error("[MW] Handover lookup error:", err);
    return NextResponse.json({ error: driveErrorMessage(err) }, { status: 500 });
  }
}
