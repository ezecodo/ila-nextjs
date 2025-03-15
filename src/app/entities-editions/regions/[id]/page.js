"use client";

import { useParams } from "next/navigation";
import EditionsByEntity from "../../../../components/EditionsByEntity/EditionsByEntity";

export default function RegionPage() {
  const { id } = useParams();

  return <EditionsByEntity entityType="regions" entityId={id} />;
}
