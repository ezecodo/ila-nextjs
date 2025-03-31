// src/app/page.tsx
// import EditionsList from "../components/EditionsList/EditionsList";
import ArticleList from "./components/Articles/ArticleList";
import LatestEdition from "./components/Editions/LatestEdition";
import EditionsList from "./components/EditionsList/EditionsList";

export default function Home() {
  return (
    <div className="max-w-full mx-auto px-4 py-6">
      {" "}
      {/* 🔥 Ocupar todo el ancho */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 🔥 Sección principal más grande */}
        <main className="col-span-1 md:col-span-12 bg-white p-6 rounded shadow">
          <LatestEdition /> {/* 🔥 Sección más ancha */}
          <ArticleList />
          <EditionsList />
        </main>
      </div>
    </div>
  );
}
