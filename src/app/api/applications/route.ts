import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { MAX_FILE_BYTES, MAX_FILE_MB } from "@/lib/uploadLimits";

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
        if (f.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { error: "ไฟล์ " + key + " ใหญ่เกิน " + MAX_FILE_MB + "MB" },
            { status: 413 }
          );
        }
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

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const formData = await req.formData();

    const id = formData.get("id");
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ไม่มี ID" }, { status: 400 });
    }

    let existingFiles: Record<string, string> = {};
    try {
      existingFiles = JSON.parse((formData.get("existingFiles") as string) || "{}");
    } catch {
      existingFiles = {};
    }

    const fields: Record<string, string> = {};
    const fileEntries: { key: string; name: string; type: string; bytes: Uint8Array }[] = [];

    for (const [key, value] of formData.entries()) {
      if (key === "id" || key === "existingFiles") continue;
      if (typeof value === "string") {
        fields[key] = value;
      } else if (typeof value === "object" && value !== null && "arrayBuffer" in value) {
        const f = value as File;
        if (f.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { error: "ไฟล์ " + key + " ใหญ่เกิน " + MAX_FILE_MB + "MB" },
            { status: 413 }
          );
        }
        if (f.size > 0) {
          const ab = await f.arrayBuffer();
          fileEntries.push({ key, name: f.name, type: f.type, bytes: new Uint8Array(ab) });
        }
      }
    }

    const { findApplicationFileId, updateJsonInDrive, uploadFileFromBytes, deleteFileFromDrive } =
      await import("@/lib/gdrive");
    const fileId = await findApplicationFileId(id);

    if (!fileId) {
      return NextResponse.json({ error: "ไม่พบใบสมัคร" }, { status: 404 });
    }

    const files = { ...existingFiles };
    for (const entry of fileEntries) {
      const ext = entry.name.split(".").pop() || "bin";
      const newName = id + "_" + entry.key + "." + ext;
      const newId = await uploadFileFromBytes(newName, entry.bytes, entry.type);
      const oldId = files[entry.key];
      files[entry.key] = newId;
      if (oldId && oldId !== newId) {
        try {
          await deleteFileFromDrive(oldId);
        } catch {
          // best-effort cleanup of the replaced file
        }
      }
    }

    await updateJsonInDrive(fileId, { id, ...fields, files, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MW] Update error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const { id, fileIds } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ไม่มี ID" }, { status: 400 });
    }

    const { findApplicationFileId, deleteFileFromDrive } = await import("@/lib/gdrive");

    const jsonFileId = await findApplicationFileId(id);
    if (jsonFileId) {
      await deleteFileFromDrive(jsonFileId);
    }

    if (fileIds && typeof fileIds === "object") {
      for (const fid of Object.values(fileIds)) {
        try {
          await deleteFileFromDrive(fid as string);
        } catch {
          // skip
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MW] Delete error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
