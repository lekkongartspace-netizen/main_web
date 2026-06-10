"use client";

export default function SaveOverlay({ message = "กำลังบันทึก..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 slide-up">
        <div
          className="h-10 w-10 border-3 border-gray-200 border-t-brand-red rounded-full"
          style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }}
        />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
