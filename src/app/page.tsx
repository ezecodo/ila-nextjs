// src/app/page.tsx
import EditionsList from "../components/EditionsList/EditionsList";
import ArticleList from "../components/Articles/ArticleList";

export default function Home() {
  return (
    // Contenedor centrado con Tailwind
    <div className="container mx-auto px-4 py-6">
      {/* 
        grid-cols-1 --> 1 columna en pantallas pequeñas (< md)
        md:grid-cols-12 --> a partir de md (768px), 12 columnas
        gap-4 --> espacio entre columnas
      */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Columna principal */}
        <main className="col-span-1 md:col-span-9 bg-white p-4 rounded shadow">
          <ArticleList />
          <EditionsList />
        </main>

        {/* Sidebar derecha, oculta en móvil */}
        <aside className="hidden md:block col-span-3 bg-gray-50 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">Sidebar Derecha</h2>
          <p className="text-sm">Contenido de prueba en la barra lateral.</p>
        </aside>
      </div>
    </div>
  );
}
