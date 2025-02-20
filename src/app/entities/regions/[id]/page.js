"use client";

import { useParams } from "next/navigation";
import ArticlesByEntity from "../../../../components/ArticlesByEntity/ArticlesByEntity";

export default function RegionPage() {
  const { id } = useParams();

  return <ArticlesByEntity entityType="regions" entityId={id} />;
}
