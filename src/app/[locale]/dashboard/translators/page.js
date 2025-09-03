import { auth } from "@/app/auth";

export default async function TranslatorDashboard() {
  const session = await auth();

  if (!session?.user || !["admin", "translator"].includes(session.user.role)) {
    return <p className="text-red-600">Acceso denegado</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Panel de Traducciones</h1>
      <p className="mt-4 text-gray-700">
        Aquí los traductores pueden ver artículos pendientes de traducción,
        trabajar en ellos y marcarlos como completados.
      </p>
    </div>
  );
}
