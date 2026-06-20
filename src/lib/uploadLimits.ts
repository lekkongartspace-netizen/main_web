// Shared upload constraints (used by both client forms and the API routes).
// Vercel serverless functions cap the request body at ~4.5MB, so the combined
// size of all attachments in one request must stay under that.

export const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB per file
export const MAX_FILE_MB = 4;

export const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 MB combined per request
export const MAX_TOTAL_MB = 4;

export const ACCEPTED_TYPES: Record<string, { exts: string[]; label: string }> = {
  photo: { exts: ["jpg", "jpeg", "png", "webp", "heic"], label: "รูปภาพ" },
  resume: { exts: ["pdf", "doc", "docx"], label: "PDF หรือ Word" },
  idCard: { exts: ["pdf", "jpg", "jpeg", "png"], label: "PDF, JPG หรือ PNG" },
};

// Returns an error message (Thai) if the file is invalid, otherwise null.
export function validateFile(file: File, kind: keyof typeof ACCEPTED_TYPES): string | null {
  const rule = ACCEPTED_TYPES[kind];
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (rule && !rule.exts.includes(ext)) {
    return "ชนิดไฟล์ไม่ถูกต้อง (รองรับ " + rule.label + ")";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "ไฟล์ใหญ่เกิน " + MAX_FILE_MB + "MB กรุณาบีบอัดก่อนอัปโหลด";
  }
  return null;
}
