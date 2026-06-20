import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

// GET — PUBLIC photo proxy for handover documents. These photos are meant to be
// shown to the client over the share link, so no auth is required. To make sure
// this can NEVER leak PII files from other features, it only serves Drive files
// whose name starts with "handover_" and refuses JSON (the document data files).
export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");
  if (!fileId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const meta = await drive.files.get({ fileId, fields: "name, mimeType" });
    const name = meta.data.name || "";
    const mimeType = meta.data.mimeType || "application/octet-stream";

    if (!name.startsWith("handover_") || mimeType === "application/json") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    return new NextResponse(res.data as ArrayBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[MW] Handover file proxy error:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
