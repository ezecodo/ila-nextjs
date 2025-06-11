// src/app/page.tsx
// import EditionsList from "../components/EditionsList/EditionsList";

// import LatestEdition from "./components/Editions/LatestEdition1";
import ArticlesGrid from "./components/Articles/ArticlesGrid/ArticlesGrid";
import ArticleCarousel from "./components/Articles/ArticleCarousel/ArticleCarousel";

export default function Home() {
  return (
    <div className="w-full px-1 sm:px-4 py-4">
      {" "}
      {/* 🔥 Ocupar todo el ancho */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 🔥 Sección principal más grande */}
        <main className="col-span-1 md:col-span-12 p-0">
          <ArticlesGrid /> {/* 🔥 Sección más ancha */}
          {/* <LatestEdition />  🔥 Sección más ancha */}
          <ArticleCarousel beitragstypId={3} title="Críticas de cine" />
          <ArticleCarousel beitragstypId={6} title="Entrevistas" />
          <ArticleCarousel beitragstypId={4} title="Música" />
          <ArticleCarousel beitragstypId={1} title="Informe y Análisis" />
        </main>
      </div>
    </div>
  );
}
