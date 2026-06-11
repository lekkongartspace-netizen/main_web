import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2;
}

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");
  if (!fileId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const meta = await drive.files.get({ fileId, fields: "mimeType" });
    const mimeType = meta.data.mimeType || "application/octet-stream";

    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const buffer = res.data as ArrayBuffer;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[MW] File proxy error:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
