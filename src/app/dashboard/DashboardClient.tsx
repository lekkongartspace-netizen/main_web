"use client";

import Navbar from "@/components/Navbar";
import InactivityGuard from "@/components/InactivityGuard";

interface Props {
  session: { name: string; role: "admin" | "user" } | null;
}

const scopeItems = [
  { icon: "🏗️", label: "Architecture", desc: "โครงสร้างและงานสถาปัตยกรรม" },
  { icon: "🎨", label: "Interior", desc: "งานตกแต่งภายใน" },
  { icon: "⚙️", label: "System", desc: "ระบบไฟฟ้า ประปา และสุขาภิบาล" },
  { icon: "🌿", label: "Landscape", desc: "งานภูมิทัศน์และสวน" },
];

const buildings = [
  "Main House", "Guest House", "Car Park", "Security", "Maid House", "Pavilion", "Landscape",
];

export default function DashboardClient({ session }: Props) {
  const isAdmin = session?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      {session && <InactivityGuard />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="slide-up">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {session ? "สวัสดี, " + session.name + " 👋" : "Matching Wealth Co., Ltd."}
          </h1>
          <p className="text-gray-500 mb-8">
            {session ? "ยินดีต้อนรับเข้าสู่ระบบ" : "ระบบจัดการโครงการและทรัพยากรบุคคล"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 slide-up" style={{ animationDelay: "0.1s" }}>
          <a href="/apply" className="card-hover group cursor-pointer">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-red transition-colors duration-300">
              <span className="text-xl group-hover:brightness-0 group-hover:invert transition-all">📝</span>
            </div>
            <h3 className="font-semibold text-gray-900">สมัครงาน</h3>
            <p className="text-sm text-gray-500 mt-1">กรอกใบสมัครพนักงานใหม่</p>
          </a>

          {isAdmin && (
            <>
              <a href="/admin" className="card-hover group cursor-pointer">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-red transition-colors duration-300">
                  <span className="text-xl group-hover:brightness-0 group-hover:invert transition-all">🔐</span>
                </div>
                <h3 className="font-semibold text-gray-900">จัดการ PIN</h3>
                <p className="text-sm text-gray-500 mt-1">เพิ่ม ลบ แก้ไข PIN ผู้ใช้</p>
              </a>
              <a href="/admin/applications" className="card-hover group cursor-pointer">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-red transition-colors duration-300">
                  <span className="text-xl group-hover:brightness-0 group-hover:invert transition-all">📋</span>
                </div>
                <h3 className="font-semibold text-gray-900">ดูใบสมัคร</h3>
                <p className="text-sm text-gray-500 mt-1">ดูรายการใบสมัครทั้งหมด</p>
              </a>
            </>
          )}

          <div className="card bg-gradient-to-br from-brand-red to-brand-darkred text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🏠</span>
            </div>
            <h3 className="font-semibold">Project Handover</h3>
            <p className="text-sm text-white/70 mt-1">เร็ว ๆ นี้</p>
          </div>
        </div>

        <div className="slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="section-title mb-4">ตัวอย่างขอบเขตงาน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {scopeItems.map((item) => (
              <div key={item.label} className="card-hover">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-green-600">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="section-title mb-4">อาคารในโครงการ</h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              {buildings.map((b, i) => (
                <div key={b} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-brand-light rounded-full flex items-center justify-center text-xs font-bold text-brand-red">{i + 1}</span>
                    <span className="text-gray-800 font-medium">{b}</span>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Completed</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 pb-8">MATCHING WEALTH CO., LTD.</div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
