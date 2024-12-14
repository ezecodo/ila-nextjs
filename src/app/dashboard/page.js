"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="h-screen bg-gray-100 flex flex-col justify-start items-center pt-8">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ILA Dashboard</h1>

      {/* Contenedor de las tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {/* Tarjeta para ingresar artículos */}
        <Link href="/articles/new">
          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition duration-200 ease-in-out">
            <i className="fas fa-file-alt text-4xl text-red-600 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-700">
              Ingresar Artículos
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Añade nuevos artículos a la base de datos.
            </p>
          </div>
        </Link>

        {/* Tarjeta para ingresar ediciones */}
        <Link href="/editions/new">
          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition duration-200 ease-in-out">
            <i className="fas fa-book text-4xl text-red-600 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-700">
              Ingresar Ediciones
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Añade ediciones de la revista ILA.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
