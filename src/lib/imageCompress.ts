// Browser-side image downscale + compression. Photos are shrunk to a sane max
// dimension and re-encoded as JPEG so each uploaded file lands well under the
// Vercel 4.5MB request-body limit (we upload one image per request anyway).

const MAX_DIMENSION = 1600; // px, longest side
const TARGET_BYTES = 1.4 * 1024 * 1024; // aim for ≤ ~1.4MB per image
const HARD_CAP_BYTES = 3.8 * 1024 * 1024; // never return anything above this

export interface CompressResult {
  file: File;
  error?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
    img.src = src;
  });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

/**
 * Compress an image file in the browser. Returns a new JPEG File. If the input
 * can't be decoded as an image (e.g. HEIC on some browsers), the original file
 * is returned with an `error` flag so the caller can decide what to do.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  if (!file.type.startsWith("image/")) {
    return { file, error: "ไฟล์นี้ไม่ใช่รูปภาพ" };
  }

  let img: HTMLImageElement;
  try {
    const dataUrl = await readAsDataURL(file);
    img = await loadImage(dataUrl);
  } catch {
    // Can't decode (HEIC etc.) — fall back to the original and let size checks run.
    return { file, error: "เบราว์เซอร์ย่อรูปนี้ไม่ได้ (เช่นไฟล์ HEIC) กรุณาแปลงเป็น JPG/PNG ก่อน" };
  }

  const { width, height } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { file, error: "ไม่รองรับการประมวลผลรูปในเบราว์เซอร์นี้" };
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Step quality down until we hit the target size (or run out of quality steps).
  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  while (blob && blob.size > TARGET_BYTES && quality > 0.4) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob) return { file, error: "บีบอัดรูปไม่สำเร็จ" };
  if (blob.size > HARD_CAP_BYTES) {
    return { file, error: "รูปใหญ่เกินไปแม้บีบอัดแล้ว กรุณาเลือกรูปที่เล็กลง" };
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  const out = new File([blob], baseName + ".jpg", { type: "image/jpeg" });
  return { file: out };
}
