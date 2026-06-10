import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const hasGoogleConfig =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID;

    const formData = await req.formData();
    const { v4: uuidv4 } = await import("uuid");
    const appId = uuidv4();
    const timestamp = new Date().toISOString();

    const fields: Record<string, string> = {};
    const fileEntries: { key: string; file: File }[] = [];

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        fields[key] = value;
      } else if (typeof value === "object" && value !== null && "arrayBuffer" in value) {
        const f = value as File;
        if (f.size > 0) {
          fileEntries.push({ key, file: f });
        }
      }
    }

    if (!hasGoogleConfig) {
      console.log("[APP] Application received (no GDrive config):", appId);
      console.log("[APP] Fields:", JSON.stringify(fields, null, 2));
      console.log("[APP] Files:", fileEntries.map((f) => f.file.name));
      return NextResponse.json({ ok: true, id: appId, note: "saved_locally" });
    }

    const { uploadJsonToDrive, uploadFileToDriveFromArrayBuffer } = await import("@/lib/gdrive");
    const fileIds: Record<string, string> = {};

    for (const entry of fileEntries) {
      const ab = await entry.file.arrayBuffer();
      const ext = entry.file.name.split(".").pop() || "bin";
      const fileName = appId + "_" + entry.key + "." + ext;
      const fileId = await uploadFileToDriveFromArrayBuffer(fileName, ab, entry.file.type);
      fileIds[entry.key] = fileId;
    }

    const applicationData = {
      id: appId,
      submittedAt: timestamp,
      ...fields,
      files: fileIds,
    };

    await uploadJsonToDrive("application_" + appId + ".json", applicationData);
    return NextResponse.json({ ok: true, id: appId });
  } catch (err) {
    console.error("[APP] Submit error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const hasGoogleConfig =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!hasGoogleConfig) {
      return NextResponse.json([]);
    }

    const { listApplications } = await import("@/lib/gdrive");
    const apps = await listApplications();
    return NextResponse.json(apps);
  } catch (err) {
    console.error("[APP] List error:", err);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}
