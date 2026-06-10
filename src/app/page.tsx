"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PinInput from "@/components/PinInput";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePin = async (pin: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "PIN ไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 slide-up">
          <div className="w-20 h-20 bg-brand-red rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
            <span className="text-white font-extrabold text-2xl">MW</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matching Wealth</h1>
          <p className="text-gray-500 mt-1">กรุณากรอก PIN เพื่อเข้าสู่ระบบ</p>
        </div>

        <div className="slide-up" style={{ animationDelay: "0.1s" }}>
          <PinInput
            length={6}
            onComplete={handlePin}
            disabled={loading}
            error={error}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center mt-6 gap-2 fade-in">
            <div
              className="h-5 w-5 border-2 border-gray-200 border-t-brand-red rounded-full"
              style={{ animation: "spin 0.7s linear infinite" }}
            />
            <span className="text-sm text-gray-500">กำลังตรวจสอบ...</span>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          MATCHING WEALTH CO., LTD.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-brand-red" />
    </div>
  );
}
