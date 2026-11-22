import { Suspense } from "react";
import UnsubscribeClient from "./UnsubscribeClient";

// Página de baja del InterLetter (link al pie de cada mail). No indexar.
export const metadata = {
  title: "InterLetter – ila",
  robots: { index: false, follow: false },
};

export default function InterletterUnsubscribePage() {
  // Suspense: useSearchParams en un client component lo exige en el build.
  return (
    <Suspense fallback={null}>
      <UnsubscribeClient />
    </Suspense>
  );
}
