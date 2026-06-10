import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadJsonToDrive, uploadFileToDrive, listApplications } from "@/lib/gdrive";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const appId = uuidv4();
    const timestamp = new Date().toISOString();

    const fields: Record<string, string> = {};
    const fileIds: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const ext = value.name.split(".").pop() || "bin";
        const fileName = appId + "_" + key + "." + ext;
        const fileId = await uploadFileToDrive(fileName, buffer, value.type);
        fileIds[key] = fileId;
      } else if (typeof value === "string") {
        fields[key] = value;
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
    return NextResponse.json({ error: "ไม่สามารถส่งใบสมัครได้" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const apps = await listApplications();
    return NextResponse.json(apps);
  } catch (err) {
    console.error("List applications error:", err);
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}
