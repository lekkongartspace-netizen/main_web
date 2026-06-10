import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
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
