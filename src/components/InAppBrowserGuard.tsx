"use client";

import { useState, useEffect } from "react";

function detectInAppBrowser(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/Line\//i.test(ua)) return "Line";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Twitter/i.test(ua) || /TwitterAndroid/i.test(ua)) return "X (Twitter)";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/TikTok/i.test(ua)) return "TikTok";
  return null;
}

export default function InAppBrowserGuard() {
  const [appName, setAppName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setAppName(detectInAppBrowser());
  }, []);

  if (!appName || dismissed) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  const handleOpenBrowser = () => {
    if (appName === "Line") {
      const lineUrl = currentUrl.includes("?")
        ? currentUrl + "&openExternalBrowser=1"
        : currentUrl + "?openExternalBrowser=1";
      window.location.href = lineUrl;
      return;
    }

    if (isAndroid) {
      window.location.href = "intent:" + currentUrl.replace(/^https?:\/\//, "//") + "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }

    navigator.clipboard?.writeText(currentUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-200">
        <span className="text-white font-extrabold text-2xl">MW</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-2">
        กรุณาเปิดใน Browser
      </h1>

      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        เว็บไซต์นี้ทำงานได้ไม่สมบูรณ์ใน {appName}
        กรุณาเปิดใน Safari หรือ Chrome เพื่อประสบการณ์ที่ดีที่สุด
      </p>

      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={handleOpenBrowser}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {appName === "Line" ? "เปิดใน Browser" : isIOS ? "คัดลอกลิงก์" : "เปิดใน Chrome"}
        </button>

        {isIOS && appName !== "Line" && (
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm text-gray-600 space-y-2">
            <p className="font-semibold text-gray-800">วิธีเปิดใน Safari:</p>
            <p>1. กดปุ่ม <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-xs">⋯</span> หรือ <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-xs">ᐧᐧᐧ</span> ที่มุมขวาล่าง</p>
            <p>2. เลือก <strong>&quot;เปิดใน Safari&quot;</strong> หรือ <strong>&quot;Open in Browser&quot;</strong></p>
          </div>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="btn-ghost w-full text-sm"
        >
          ใช้งานต่อแบบนี้
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-brand-red" />
    </div>
  );
}
