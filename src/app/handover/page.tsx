"use client";

import { useState } from "react";

export default function HandoverLookupPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) {
      setError("กรุณากรอกรหัสโครงการ");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/handover/lookup?code=" + encodeURIComponent(c));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่พบโครงการ");
      window.location.href = "/handover/" + data.id + "?token=" + data.token;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่พบโครงการ");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card slide-up">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-200">
              <span className="text-white font-extrabold text-xl">MW</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">เอกสารส่งมอบงาน</h1>
            <p className="text-gray-500 text-sm mt-1">กรอกรหัสโครงการเพื่อดูเอกสารและตรวจรับงาน</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">รหัสโครงการ</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field text-center text-lg tracking-wide"
                placeholder="กรอกรหัสโครงการ"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "กำลังค้นหา..." : "เปิดเอกสาร"}
            </button>
          </form>

          <div className="text-center mt-5">
            <a href="/" className="text-sm text-gray-400 hover:text-brand-red">← กลับหน้าหลัก</a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">MATCHING WEALTH CO., LTD.</p>
      </div>
    </div>
  );
}
