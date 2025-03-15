"use client";

import { useParams } from "next/navigation";
import EditionsByEntity from "../../../../components/EditionsByEntity/EditionsByEntity";

export default function CategoriesPage() {
  const { id } = useParams();

  return <EditionsByEntity entityType="categories" entityId={id} />;
}
