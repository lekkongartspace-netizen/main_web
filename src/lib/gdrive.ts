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

  return res.data.id || "";
}

export async function listApplications(): Promise<unknown[]> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "'" + process.env.GOOGLE_DRIVE_FOLDER_ID + "' in parents and name contains 'application_' and mimeType='application/json' and trashed=false",
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime desc",
  });

  const files = res.data.files || [];
  const results = [];

  for (const file of files) {
    const content = await drive.files.get({
      fileId: file.id!,
      alt: "media",
    });
    results.push({ id: file.id, createdAt: file.createdTime, ...(content.data as object) });
  }

  return results;
}
