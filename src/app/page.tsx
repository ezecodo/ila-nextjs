// src/app/page.tsx

import EditionsList from "../components/EditionsList/EditionsList";
import ArticlesList from "../components/ArticlesList/ArticlesList";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row max-w-full mx-0 px-0 gap-0">
      {/* Bloque de la izquierda */}
      <aside className="hidden md:block bg-gray-100 p-4 rounded-lg shadow w-1/6">
        <h2 className="text-lg font-bold">Bloque Izquierdo</h2>
        <p>Contenido pendiente por definir.</p>
      </aside>

      {/* Bloque central */}
      <main className="w-full md:w-4/6 flex-grow">
        <ArticlesList />
        <EditionsList />
      </main>

      {/* Bloque de la derecha */}
      <aside className="hidden md:block bg-gray-100 p-4 rounded-lg shadow w-1/6">
        <h2 className="text-lg font-bold">Bloque Derecho</h2>
        <p>Contenido pendiente por definir.</p>
      </aside>
    </div>
  );
}
