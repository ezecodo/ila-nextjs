"use client";

export default function Loader({ size = 12, color = "border-red-600" }) {
  return (
    <div className="flex justify-center items-center py-16">
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-b-2 ${color}`}
      ></div>
    </div>
  );
}
