"use client";

import { useState } from "react";

export default function PreviewHover({ preview, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div className="absolute left-1/2 top-full mt-2 transform -translate-x-1/2 z-50 w-[90%] max-w-[500px] bg-white/80 backdrop-blur-sm border border-gray-300 shadow-xl rounded-lg p-4">
          <p className="text-sm text-gray-800 leading-snug line-clamp-4">
            {preview}
          </p>
        </div>
      )}
    </div>
  );
}
