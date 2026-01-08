"use client";

import { Suspense } from "react";
import AktuellesList from "../../components/AktuellesList/AktuellesList";
import IlaLoader from "../../components/IlaLoader/IlaLoader";

export default function AktuellesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <IlaLoader />
        </div>
      }
    >
      <AktuellesList />
    </Suspense>
  );
}
