"use client";

import Link from "next/link";

export default function DashboardSectionHeader({
  title,
  createUrl,
  createLabel,
  color = "red",
}) {
  const colorClasses = {
    purple: "text-purple-700",
    red: "text-red-700",
    blue: "text-blue-700",
    green: "text-green-700",
  };

  return (
    <div className="mb-6">
      <h1
        className={`text-2xl font-bold mb-2 ${colorClasses[color] || "text-red-700"}`}
      >
        {title}
      </h1>

      {createUrl && createLabel && (
        <Link
          href={createUrl}
          className="inline-block text-blue-600 hover:underline"
        >
          ➕ {createLabel}
        </Link>
      )}
    </div>
  );
}
