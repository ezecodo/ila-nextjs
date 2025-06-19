// src/app/page.tsx
// import EditionsList from "../components/EditionsList/EditionsList";

import LatestEdition from "./components/Editions/LatestEdition1";

import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";

export default function Home() {
  return (
    <div className="w-full px-1 sm:px-4 py-4">
      {" "}
      {/* 🔥 Ocupar todo el ancho */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 🔥 Sección principal más grande */}
        <main className="col-span-1 md:col-span-12 p-0">
          <CarouselFromDb />
          <LatestEdition />
        </main>
      </div>
    </div>
  );
}
