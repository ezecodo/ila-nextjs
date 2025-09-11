"use client";

import EditionForm from "../../components/Editions/EditionForm";

export default function NewEditionPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <EditionForm mode="create" />
    </div>
  );
}
