// src/app/page.tsx

import EditionsList from "../components/EditionsList/EditionsList";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 gap-4">
      {/* Bloque de la izquierda */}
      <aside className="hidden md:block md:w-1/6 bg-gray-100 p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold">Bloque Izquierdo</h2>
        <p>Contenido pendiente por definir.</p>
      </aside>

      {/* Bloque central */}
      <main className="w-full md:w-4/6">
        <EditionsList />
      </main>

      {/* Bloque de la derecha */}
      <aside className="hidden md:block md:w-1/6 bg-gray-100 p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold">Bloque Derecho</h2>
        <p>Contenido pendiente por definir.</p>
      </aside>
    </div>
  );
}
