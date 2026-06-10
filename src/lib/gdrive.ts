import { google } from "googleapis";

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

  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    mimeType: "application/json",
  };

  const media = {
    mimeType: "application/json",
    body: JSON.stringify(data, null, 2),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });

  return res.data.id || "";
}

export async function uploadFileToDrive(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const { Readable } = await import("stream");

  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
  };

  const media = {
    mimeType,
    body: Readable.from(buffer),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });

  return res.data.id || "";
}

export async function uploadFileToDriveFromArrayBuffer(
  fileName: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const { Readable } = await import("stream");

  const uint8 = new Uint8Array(arrayBuffer);

  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
  };

  const media = {
    mimeType,
    body: Readable.from(uint8),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
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
