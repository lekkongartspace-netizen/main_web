import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

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
    const fileNames: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        fileNames[key] = value.name;
      } else if (typeof value === "string") {
        fields[key] = value;
      }
    }

    if (!hasGoogleConfig) {
      console.log("Application received (Google Drive not configured):", appId);
      console.log("Fields:", JSON.stringify(fields, null, 2));
      console.log("Files:", fileNames);
      return NextResponse.json({ ok: true, id: appId, note: "saved_locally" });
    }

    const { uploadJsonToDrive, uploadFileToDrive } = await import("@/lib/gdrive");
    const fileIds: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const ext = value.name.split(".").pop() || "bin";
        const fileName = appId + "_" + key + "." + ext;
        const fileId = await uploadFileToDrive(fileName, buffer, value.type);
        fileIds[key] = fileId;
      }
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
    console.error("Application submit error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "ไม่สามารถส่งใบสมัครได้: " + message }, { status: 500 });
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
    console.error("List applications error:", err);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}
