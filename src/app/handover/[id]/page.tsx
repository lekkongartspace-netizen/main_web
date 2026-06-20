import { normalizeHandover, HandoverDoc } from "@/lib/handoverTypes";
import HandoverDocumentClient from "./HandoverDocumentClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
  searchParams: { token?: string };
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card text-center max-w-md">
        <span className="text-5xl block mb-4">🔒</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่สามารถเปิดเอกสารได้</h1>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}

export default async function HandoverDocPage({ params, searchParams }: PageProps) {
  const token = searchParams?.token || "";
  if (!token) return <InvalidLink message="ลิงก์ไม่สมบูรณ์ กรุณาใช้ลิงก์ที่ได้รับจากบริษัท" />;

  let found: { driveFileId: string; data: Record<string, unknown> } | null = null;
  try {
    const { getHandover } = await import("@/lib/gdrive");
    found = await getHandover(params.id);
  } catch {
    return <InvalidLink message="เกิดข้อผิดพลาดในการโหลดเอกสาร กรุณาลองใหม่อีกครั้ง" />;
  }

  if (!found) return <InvalidLink message="ไม่พบเอกสารนี้ อาจถูกลบไปแล้ว" />;
  if (found.data.shareToken !== token) {
    return <InvalidLink message="ลิงก์ไม่ถูกต้องหรือหมดอายุ" />;
  }

  const doc = normalizeHandover(found.data as Partial<HandoverDoc> & { id: string; shareToken: string });
  return <HandoverDocumentClient doc={doc} token={token} />;
}
