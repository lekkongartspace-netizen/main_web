import { google } from "googleapis";
import { Readable } from "stream";

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

export async function uploadJsonToDrive(
  fileName: string,
  data: Record<string, unknown>
): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      mimeType: "application/json",
    },
    media: {
      mimeType: "application/json",
      body: JSON.stringify(data, null, 2),
    },
    fields: "id",
  });

  return res.data.id || "";
}

export async function uploadFileFromBytes(
  fileName: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const stream = new Readable();
  stream.push(bytes);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id",
  });

  // Files are NOT made public — they hold PII (ID cards, photos) and are
  // served only to authenticated admins via the /api/files proxy.
  return res.data.id || "";
}

export async function listApplications(): Promise<unknown[]> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  // Page through every matching file (Drive returns max 100 by default).
  const files: { id?: string | null; createdTime?: string | null }[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: "'" + process.env.GOOGLE_DRIVE_FOLDER_ID + "' in parents and name contains 'application_' and mimeType='application/json' and trashed=false",
      fields: "nextPageToken, files(id, name, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 100,
      pageToken,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  // Fetch file contents in parallel.
  const results = await Promise.all(
    files.map(async (file) => {
      const content = await drive.files.get({ fileId: file.id!, alt: "media" });
      return { id: file.id, createdAt: file.createdTime, ...(content.data as object) };
    })
  );

  return results;
}

export async function updateJsonInDrive(
  fileId: string,
  data: Record<string, unknown>
): Promise<void> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/json",
      body: JSON.stringify(data, null, 2),
    },
  });
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  await drive.files.delete({ fileId });
}

export async function findApplicationFileId(appId: string): Promise<string | null> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "'" + process.env.GOOGLE_DRIVE_FOLDER_ID + "' in parents and name='application_" + appId + ".json' and trashed=false",
    fields: "files(id)",
  });

  return res.data.files?.[0]?.id || null;
}

// ---------------------------------------------------------------------------
// Project Handover documents
// Stored as handover_<id>.json; photos as handover_<id>_<key>.<ext> files.
// ---------------------------------------------------------------------------

export async function listHandovers(): Promise<unknown[]> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const files: { id?: string | null; createdTime?: string | null }[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: "'" + process.env.GOOGLE_DRIVE_FOLDER_ID + "' in parents and name contains 'handover_' and mimeType='application/json' and trashed=false",
      fields: "nextPageToken, files(id, name, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 100,
      pageToken,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  const results = await Promise.all(
    files.map(async (file) => {
      const content = await drive.files.get({ fileId: file.id!, alt: "media" });
      return { driveFileId: file.id, createdAt: file.createdTime, ...(content.data as object) };
    })
  );

  return results;
}

export async function findHandoverFileId(id: string): Promise<string | null> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "'" + process.env.GOOGLE_DRIVE_FOLDER_ID + "' in parents and name='handover_" + id + ".json' and trashed=false",
    fields: "files(id)",
  });

  return res.data.files?.[0]?.id || null;
}

export async function getHandover(
  id: string
): Promise<{ driveFileId: string; data: Record<string, unknown> } | null> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const fileId = await findHandoverFileId(id);
  if (!fileId) return null;

  const content = await drive.files.get({ fileId, alt: "media" });
  return { driveFileId: fileId, data: (content.data as Record<string, unknown>) || {} };
}

// Returns { name, mimeType } for a Drive file, used by the public photo proxy
// to confirm a file is a handover asset before serving it without auth.
export async function getDriveFileMeta(
  fileId: string
): Promise<{ name: string; mimeType: string } | null> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  try {
    const meta = await drive.files.get({ fileId, fields: "name, mimeType" });
    return {
      name: meta.data.name || "",
      mimeType: meta.data.mimeType || "application/octet-stream",
    };
  } catch {
    return null;
  }
}
