"use client";

export default function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-12 w-12" : "h-8 w-8";
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className={`${s} border-3 border-gray-200 border-t-brand-red rounded-full`}
        style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }}
      />
    </div>
  );
}
