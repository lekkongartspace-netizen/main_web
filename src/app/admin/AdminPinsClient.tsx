"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import SaveOverlay from "@/components/SaveOverlay";
import InactivityGuard from "@/components/InactivityGuard";
import Toggle from "@/components/Toggle";
import { PERMISSIONS, type Permission, type SessionInfo } from "@/lib/permissions";

interface Pin {
  name: string;
  pin: string;
  permissions: Permission[];
}

interface Props {
  session: SessionInfo;
}

export default function AdminPinsClient({ session }: Props) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [originalPins, setOriginalPins] = useState<string>("[]");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDirty = JSON.stringify(pins) !== originalPins;
  // Mirrors the server-side safeguard: someone must always be able to manage PINs.
  const noManager = pins.length > 0 && !pins.some((p) => p.permissions.includes("managePins"));

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
      const normalized: Pin[] = (Array.isArray(data) ? data : []).map((p) => ({
        name: p.name ?? "",
        pin: p.pin ?? "",
        permissions: Array.isArray(p.permissions) ? p.permissions : [],
      }));
      setPins(normalized);
      setOriginalPins(JSON.stringify(normalized));
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
    setPins([...pins, { name: "", pin: "", permissions: [] }]);
  };

  const removePin = (idx: number) => {
    setPins(pins.filter((_, i) => i !== idx));
  };

  const updatePin = (idx: number, key: "name" | "pin", val: string) => {
    const updated = [...pins];
    updated[idx] = { ...updated[idx], [key]: val };
    setPins(updated);
  };

  const togglePerm = (idx: number, perm: Permission, on: boolean) => {
    const updated = [...pins];
    const current = updated[idx].permissions;
    updated[idx] = {
      ...updated[idx],
      permissions: on ? [...current, perm] : current.filter((p) => p !== perm),
    };
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
            <p className="text-gray-500 mt-1">เพิ่ม ลบ แก้ไข PIN และกำหนดสิทธิ์การใช้งาน</p>
          </div>
          <button onClick={addPin} className="btn-primary">+ เพิ่ม PIN</button>
        </div>

        {isDirty && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 fade-in text-sm flex items-center justify-between gap-4">
            <span>⚠️ การเปลี่ยนแปลงยังไม่ได้บันทึก</span>
            <button onClick={handleSave} disabled={noManager} className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50">
              บันทึก
            </button>
          </div>
        )}

        {noManager && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 fade-in text-sm">
            ต้องมีอย่างน้อย 1 PIN ที่เปิดสิทธิ์ “จัดการ PIN” มิฉะนั้นจะไม่มีใครแก้ไขหน้านี้ได้อีก
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
              <div key={idx} className="card relative">
                <button
                  type="button"
                  onClick={() => removePin(idx)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1"
                  aria-label="ลบ PIN"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="flex flex-col sm:flex-row gap-4 pr-8">
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
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="label mb-3">สิทธิ์การใช้งาน</p>
                  <div className="space-y-3">
                    {PERMISSIONS.map((perm) => (
                      <div key={perm.key} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{perm.label}</p>
                          <p className="text-xs text-gray-400">{perm.desc}</p>
                        </div>
                        <Toggle
                          checked={p.permissions.includes(perm.key)}
                          onChange={(on) => togglePerm(idx, perm.key, on)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
                <button onClick={handleSave} disabled={noManager} className="btn-primary disabled:opacity-50">
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
