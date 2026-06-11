"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import SaveOverlay from "@/components/SaveOverlay";
import InactivityGuard from "@/components/InactivityGuard";

interface Pin {
  name: string;
  pin: string;
  role: "admin" | "user";
}

interface Props {
  session: { name: string; role: "admin" | "user" };
}

export default function AdminPinsClient({ session }: Props) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [originalPins, setOriginalPins] = useState<string>("[]");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDirty = JSON.stringify(pins) !== originalPins;

  useEffect(() => {
    loadPins();
  }, []);

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    },
    [isDirty]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload]);

  const loadPins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pins");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPins(data);
      setOriginalPins(JSON.stringify(data));
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/pins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pins),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOriginalPins(JSON.stringify(pins));
      setSuccess("บันทึกสำเร็จ");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  };

  const addPin = () => {
    const newPin: Pin = { name: "", pin: "", role: "user" };
    setPins([...pins, newPin]);
  };

  const removePin = (idx: number) => {
    setPins(pins.filter((_, i) => i !== idx));
  };

  const updatePin = (idx: number, key: keyof Pin, val: string) => {
    const updated = [...pins];
    updated[idx] = { ...updated[idx], [key]: key === "role" ? val as "admin" | "user" : val };
    setPins(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <InactivityGuard />
      {saving && <SaveOverlay />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 slide-up">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการ PIN</h1>
            <p className="text-gray-500 mt-1">เพิ่ม ลบ แก้ไข PIN ผู้ใช้งานระบบ</p>
          </div>
          <button onClick={addPin} className="btn-primary">+ เพิ่ม PIN</button>
        </div>

        {isDirty && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 fade-in text-sm flex items-center justify-between gap-4">
            <span>⚠️ การเปลี่ยนแปลงยังไม่ได้บันทึก</span>
            <button onClick={handleSave} className="btn-primary text-sm px-4 py-1.5">
              บันทึก
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 fade-in text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 fade-in text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-4 slide-up">
            {pins.map((p, idx) => (
              <div key={idx} className="card flex flex-col sm:flex-row gap-4 items-start sm:items-end relative group">
                <div className="flex-1 w-full">
                  <label className="label">ชื่อ</label>
                  <input
                    value={p.name}
                    onChange={(e) => updatePin(idx, "name", e.target.value)}
                    className="input-field"
                    placeholder="ชื่อผู้ใช้"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label className="label">PIN</label>
                  <input
                    value={p.pin}
                    onChange={(e) => updatePin(idx, "pin", e.target.value.replace(/\D/g, ""))}
                    className="input-field font-mono tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div className="w-full sm:w-36">
                  <label className="label">สิทธิ์</label>
                  <select
                    value={p.role}
                    onChange={(e) => updatePin(idx, "role", e.target.value)}
                    className="input-field"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removePin(idx)}
                  className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {pins.length === 0 && (
              <div className="card text-center py-10 text-gray-400">
                <p>ยังไม่มี PIN ในระบบ</p>
                <button onClick={addPin} className="btn-secondary mt-4">+ เพิ่ม PIN แรก</button>
              </div>
            )}

            {pins.length > 0 && (
              <div className="flex justify-end pt-4">
                <button onClick={handleSave} className="btn-primary">
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
