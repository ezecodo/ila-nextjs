"use client";

import ArticlesList from "@/app/[locale]/dashboard/components/ArticlesList/ArticlesList";

export default function ReviewPage() {
  return (
    <div className="p-4">
      <ArticlesList mode="reviewer" />
    </div>
  );
}
