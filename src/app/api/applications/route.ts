import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isGoogleDriveReady(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
  return clientId.length > 5 && clientSecret.length > 5 && refreshToken.length > 10 && folder.length > 5;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    let appId: string;
    try {
      const { v4 } = await import("uuid");
      appId = v4();
    } catch {
      appId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    const timestamp = new Date().toISOString();
    const fields: Record<string, string> = {};
    const fileEntries: { key: string; name: string; type: string; bytes: Uint8Array }[] = [];

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        fields[key] = value;
      } else if (typeof value === "object" && value !== null && "arrayBuffer" in value) {
        const f = value as File;
        if (f.size > 0) {
          const ab = await f.arrayBuffer();
          fileEntries.push({
            key,
            name: f.name,
            type: f.type,
            bytes: new Uint8Array(ab),
          });
        }
      }
    }

    const driveReady = isGoogleDriveReady();

    if (!driveReady) {
      return NextResponse.json({
        ok: true,
        id: appId,
        warning: "Google Drive ยังไม่ได้ตั้งค่า ข้อมูลยังไม่ได้บันทึก",
      });
    }

    const gdrive = await import("@/lib/gdrive");
    const fileIds: Record<string, string> = {};

    for (const entry of fileEntries) {
      const ext = entry.name.split(".").pop() || "bin";
      const fileName = appId + "_" + entry.key + "." + ext;
      const fileId = await gdrive.uploadFileFromBytes(fileName, entry.bytes, entry.type);
      fileIds[entry.key] = fileId;
    }

    await gdrive.uploadJsonToDrive("application_" + appId + ".json", {
      id: appId,
      submittedAt: timestamp,
      ...fields,
      files: fileIds,
    });

    return NextResponse.json({ ok: true, id: appId });
  } catch (err) {
    console.error("[MW] Submit error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Google Drive error: " + msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  if (!isGoogleDriveReady()) {
    return NextResponse.json([]);
  }

  try {
    const { listApplications } = await import("@/lib/gdrive");
    const apps = await listApplications();
    return NextResponse.json(apps);
  } catch (err) {
    console.error("[MW] List error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
