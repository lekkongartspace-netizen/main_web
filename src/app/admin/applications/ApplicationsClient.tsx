"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import InactivityGuard from "@/components/InactivityGuard";

interface Application {
  id: string;
  createdAt: string;
  prefixTh?: string;
  firstNameTh?: string;
  lastNameTh?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  expectedSalary?: string;
  [key: string]: unknown;
}

interface Props {
  userName: string;
  role: "admin" | "user";
}

export default function ApplicationsClient({ userName, role }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setApps(data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ (อาจยังไม่ได้ตั้งค่า Google Drive)");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={userName} role={role} />
      <InactivityGuard />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 slide-up">
          <h1 className="text-3xl font-bold text-gray-900">ใบสมัครงาน</h1>
          <p className="text-gray-500 mt-1">รายการใบสมัครทั้งหมดที่ส่งเข้ามา</p>
        </div>

        {error && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <div className="card text-center py-16 text-gray-400 slide-up">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">ยังไม่มีใบสมัคร</p>
          </div>
        ) : (
          <div className="space-y-3 slide-up">
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelected(app)}
                className="card-hover cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {app.prefixTh}{app.firstNameTh} {app.lastNameTh}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {app.firstNameEn} {app.lastNameEn} · {app.nationality}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {formatDate(app.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดใบสมัคร</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {Object.entries(selected).map(([key, val]) => {
                  if (key === "files" || key === "id") return null;
                  const display = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);
                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-50">
                      <span className="font-medium text-gray-500 sm:w-40 shrink-0">{key}</span>
                      <span className="text-gray-800 break-all whitespace-pre-wrap">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
