"use client";

import { useParams } from "next/navigation";
import EditionsByEntity from "../../../../components/EditionsByEntity/EditionsByEntity";

export default function TopicsPage() {
  const { id } = useParams();

  return <EditionsByEntity entityType="topics" entityId={id} />;
}
