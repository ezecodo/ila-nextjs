// src/app/page.tsx
// import EditionsList from "../components/EditionsList/EditionsList";
import ArticleList from "../components/Articles/ArticleList";
import LatestEdition from "../components/Editions/LatestEdition";

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
        </main>

        {/* 🔥 Si aún quieres el sidebar, lo dejamos aquí pero en otra fila en móviles */}
        <aside className="hidden md:block md:col-span-3 bg-gray-50 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">Sidebar</h2>
          <p className="text-sm">Contenido de prueba.</p>
        </aside>
      </div>
    </div>
  );
}
