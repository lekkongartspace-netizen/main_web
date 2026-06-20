import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { driveErrorMessage } from "@/lib/driveError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isGoogleDriveReady(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
  return clientId.length > 5 && clientSecret.length > 5 && refreshToken.length > 10 && folder.length > 5;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return false;
  return true;
}

function randomId(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Collect every Drive photo id referenced by a document (for cleanup on delete).
function collectFileIds(doc: Record<string, unknown>): string[] {
  const ids: string[] = [];
  if (typeof doc.siteImageFileId === "string" && doc.siteImageFileId) ids.push(doc.siteImageFileId);
  const buildings = doc.buildings as Array<{ imageFileId?: string }> | undefined;
  buildings?.forEach((b) => b.imageFileId && ids.push(b.imageFileId));
  const details = doc.detailImages as Array<{ fileId?: string }> | undefined;
  details?.forEach((d) => d.fileId && ids.push(d.fileId));
  return ids;
}

// GET — list all handover documents (admin only).
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  if (!isGoogleDriveReady()) return NextResponse.json([]);

  try {
    const { listHandovers } = await import("@/lib/gdrive");
    return NextResponse.json(await listHandovers());
  } catch (err) {
    console.error("[MW] Handover list error:", err);
    return NextResponse.json({ error: driveErrorMessage(err) }, { status: 500 });
  }
}

// POST — create a new handover document (admin only).
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = randomId();
    const shareToken = randomToken();
    const now = new Date().toISOString();

    const doc = {
      ...body,
      id,
      shareToken,
      createdAt: now,
      updatedAt: now,
    };
    delete (doc as Record<string, unknown>).driveFileId;

    const { uploadJsonToDrive } = await import("@/lib/gdrive");
    await uploadJsonToDrive("handover_" + id + ".json", doc);

    return NextResponse.json({ ok: true, id, shareToken });
  } catch (err) {
    console.error("[MW] Handover create error:", err);
    return NextResponse.json({ error: driveErrorMessage(err) }, { status: 500 });
  }
}

// PUT — update an existing handover document (admin only).
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = body.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ไม่มี ID" }, { status: 400 });
    }

    const { getHandover, updateJsonInDrive } = await import("@/lib/gdrive");
    const existing = await getHandover(id);
    if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

    // Preserve immutable + client-supplied fields the admin form must not overwrite.
    const merged = {
      ...existing.data,
      ...body,
      id,
      shareToken: existing.data.shareToken,
      createdAt: existing.data.createdAt,
      updatedAt: new Date().toISOString(),
    };
    delete (merged as Record<string, unknown>).driveFileId;

    await updateJsonInDrive(existing.driveFileId, merged);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MW] Handover update error:", err);
    return NextResponse.json({ error: driveErrorMessage(err) }, { status: 500 });
  }
}

// DELETE — remove a document and its uploaded photos (admin only).
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }
  if (!isGoogleDriveReady()) {
    return NextResponse.json({ error: "Google Drive ยังไม่ได้ตั้งค่า" }, { status: 500 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ไม่มี ID" }, { status: 400 });

    const { getHandover, deleteFileFromDrive } = await import("@/lib/gdrive");
    const existing = await getHandover(id);
    if (!existing) return NextResponse.json({ ok: true });

    for (const fid of collectFileIds(existing.data)) {
      try {
        await deleteFileFromDrive(fid);
      } catch {
        // best-effort cleanup of orphaned photos
      }
    }
    await deleteFileFromDrive(existing.driveFileId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MW] Handover delete error:", err);
    return NextResponse.json({ error: driveErrorMessage(err) }, { status: 500 });
  }
}
