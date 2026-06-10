"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  userName: string;
  role: "admin" | "user";
}

export default function Navbar({ userName, role }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/dashboard", label: "หน้าหลัก" },
    { href: "/apply", label: "สมัครงาน" },
    ...(role === "admin"
      ? [
          { href: "/admin", label: "จัดการ PIN" },
          { href: "/admin/applications", label: "ใบสมัคร" },
        ]
      : []),
  ];

  return (
    <>
      {loggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 border-3 border-gray-200 border-t-brand-red rounded-full"
              style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }}
            />
            <p className="text-gray-700 font-medium">กำลังออกจากระบบ...</p>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MW</span>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">Matching Wealth</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-light rounded-full flex items-center justify-center">
                  <span className="text-brand-red text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{userName}</span>
                <span className="text-xs bg-brand-light text-brand-red px-2 py-0.5 rounded-full font-medium">
                  {role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                ออกจากระบบ
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white fade-in">
            <div className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-7 h-7 bg-brand-light rounded-full flex items-center justify-center">
                  <span className="text-brand-red text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{userName}</span>
                <span className="text-xs bg-brand-light text-brand-red px-2 py-0.5 rounded-full font-medium">
                  {role}
                </span>
              </div>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
