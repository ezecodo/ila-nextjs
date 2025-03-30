"use client";

import { useParams } from "next/navigation";
import ArticlesByEntity from "@/components/ArticlesByEntity/ArticlesByEntity";

export default function TopicsPage() {
  const { id } = useParams();

  return <ArticlesByEntity entityType="topics" entityId={id} />;
}
