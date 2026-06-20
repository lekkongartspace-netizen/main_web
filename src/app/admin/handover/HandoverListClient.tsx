"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import InactivityGuard from "@/components/InactivityGuard";
import { HandoverDoc, STATUS_LABELS, formatThaiDate, HandoverStatus } from "@/lib/handoverTypes";

interface Props {
  session: { name: string; role: "admin" | "user" };
}

const STATUS_STYLE: Record<HandoverStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

function shareUrl(doc: HandoverDoc): string {
  if (typeof window === "undefined") return "";
  return window.location.origin + "/handover/" + doc.id + "?token=" + doc.shareToken;
}

export default function HandoverListClient({ session }: Props) {
  const [docs, setDocs] = useState<HandoverDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/handover");
      if (!res.ok) throw new Error("Failed");
      setDocs(await res.json());
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ (อาจยังไม่ได้ตั้งค่า Google Drive)");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (doc: HandoverDoc) => {
    try {
      await navigator.clipboard.writeText(shareUrl(doc));
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(""), 1800);
    } catch {
      window.prompt("คัดลอกลิงก์นี้สำหรับลูกค้า:", shareUrl(doc));
    }
  };

  const handleDelete = async (doc: HandoverDoc) => {
    setDeletingId(doc.id);
    try {
      const res = await fetch("/api/handover", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setDocs((prev) => prev.filter((x) => x.id !== doc.id));
      setConfirmId("");
    } catch (err) {
      alert("ลบไม่สำเร็จ: " + (err instanceof Error ? err.message : ""));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <InactivityGuard />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 slide-up">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">เอกสารส่งมอบงาน</h1>
            <p className="text-gray-500 mt-1">
              Project Handover {docs.length > 0 ? "(" + docs.length + " รายการ)" : ""}
            </p>
          </div>
          <a href="/admin/handover/edit" className="btn-primary text-center whitespace-nowrap">
            + สร้างเอกสารใหม่
          </a>
        </div>

        {error && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {loading ? (
          <Spinner />
        ) : docs.length === 0 ? (
          <div className="card text-center py-16 text-gray-400 slide-up">
            <span className="text-5xl block mb-4">🏠</span>
            <p className="text-lg font-medium">ยังไม่มีเอกสารส่งมอบงาน</p>
            <p className="text-sm mt-1">เริ่มสร้างเอกสารแรกของคุณได้เลย</p>
          </div>
        ) : (
          <div className="space-y-3 slide-up">
            {docs.map((doc) => (
              <div key={doc.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-xl">🏠</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {doc.projectName || "(ยังไม่ตั้งชื่อโครงการ)"}
                      </h3>
                      <span
                        className={
                          "text-xs px-2.5 py-0.5 rounded-full font-medium " +
                          (STATUS_STYLE[doc.status] || STATUS_STYLE.draft)
                        }
                      >
                        {STATUS_LABELS[doc.status] || "ฉบับร่าง"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {doc.projectCode ? doc.projectCode + " · " : ""}
                      {doc.location || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">สร้างเมื่อ {formatThaiDate(doc.createdAt)}</p>

                    {doc.clientSubmittedAt && (
                      <div
                        className={
                          "mt-2 text-xs rounded-lg px-3 py-2 " +
                          (doc.clientResult === "fail"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700")
                        }
                      >
                        {doc.clientResult === "fail" ? "❌ ลูกค้าไม่ผ่าน" : "✅ ลูกค้าตรวจรับแล้ว"}
                        {doc.clientName ? " โดย " + doc.clientName : ""} ·{" "}
                        {formatThaiDate(doc.clientSubmittedAt)}
                        {doc.clientResult === "fail" && doc.clientReason ? " — " + doc.clientReason : ""}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      <a
                        href={"/handover/" + doc.id + "?token=" + doc.shareToken}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-brand-red border border-brand-red/30 hover:bg-brand-light rounded-lg px-3 py-1.5 transition-colors"
                      >
                        เปิด / พิมพ์ PDF
                      </a>
                      <button
                        onClick={() => copyLink(doc)}
                        className="text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {copiedId === doc.id ? "✓ คัดลอกแล้ว" : "คัดลอกลิงก์ลูกค้า"}
                      </button>
                      <a
                        href={"/admin/handover/edit?id=" + doc.id}
                        className="text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        แก้ไข
                      </a>
                      <button
                        onClick={() => setConfirmId(doc.id)}
                        className="text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        ลบ
                      </button>
                    </div>

                    {confirmId === doc.id && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 fade-in">
                        <p className="text-sm text-red-700 font-medium mb-2">
                          ยืนยันลบเอกสาร &quot;{doc.projectName || "ไม่มีชื่อ"}&quot;? (ลบรูปทั้งหมดด้วย กู้คืนไม่ได้)
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingId === doc.id ? "กำลังลบ..." : "ยืนยันลบ"}
                          </button>
                          <button onClick={() => setConfirmId("")} className="btn-ghost text-xs">
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
