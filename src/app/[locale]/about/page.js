"use client";

import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("about");
  const paragraphs = t.raw("paragraphs");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>

      {paragraphs.slice(0, 3).map((text, index) => (
        <p className="mb-4" key={`intro-${index}`}>
          {text}
        </p>
      ))}

      <h3 className="text-2xl font-bold mt-6 mb-2">{t("historyTitle")}</h3>
      {paragraphs.slice(3, 6).map((text, index) => (
        <p className="mb-4" key={`history-${index}`}>
          {text}
        </p>
      ))}

      <h3 className="text-2xl font-bold mt-6 mb-2">{t("futureTitle")}</h3>
      {paragraphs.slice(6, 8).map((text, index) => (
        <p className="mb-4" key={`future-${index}`}>
          {text}
        </p>
      ))}

      <h3 className="text-2xl font-bold mt-6 mb-2">{t("awardTitle")}</h3>
      <p className="mb-4">{paragraphs[8]}</p>
    </div>
  );
}
