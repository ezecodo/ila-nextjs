import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FaGlobeAmericas,
  FaPenNib,
  FaRegFileAlt,
  FaBookOpen,
  FaArrowRight,
  FaCheckCircle,
  FaUsers,
} from "react-icons/fa";

function Ila({ className = "" }) {
  return (
    <span
      className={`font-extrabold lowercase ${className}`}
      style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
    >
      ila
    </span>
  );
}

export default async function TranslatorDashboard({ params }) {
  const session = await auth();

  if (!session?.user || !["admin", "translator"].includes(session.user.role)) {
    return <p className="text-red-600">Acceso denegado</p>;
  }

  const { locale } = await params;

  const [siteTranslated, myTranslated, recentTranslations] = await Promise.all([
    prisma.article.count({ where: { translationStatus: "approved" } }),
    prisma.article.count({
      where: {
        translationStatus: "approved",
        translatorId: session.user.id,
      },
    }),
    prisma.article.findMany({
      where: {
        translationStatus: "approved",
        reviewedAt: { not: null },
        translatorId: { not: null },
      },
      orderBy: { reviewedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        titleES: true,
        legacyPath: true,
        reviewedAt: true,
        translator: { select: { name: true } },
        edition: { select: { number: true } },
      },
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0] || "";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
        Hola{firstName ? `, ${firstName}` : ""}
      </p>

      {/* Estadísticas — arriba del todo */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <FaGlobeAmericas className="shrink-0 text-3xl text-[#BD0E0D]" />
          <div>
            <p
              className="text-4xl font-extrabold leading-none text-[#BD0E0D]"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              {siteTranslated}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              artículos traducidos al español en todo el sitio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <FaPenNib className="shrink-0 text-3xl text-gray-700 dark:text-gray-300" />
          <div>
            <p
              className="text-4xl font-extrabold leading-none text-gray-900 dark:text-gray-100"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              {myTranslated}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {myTranslated === 1
                ? "traducción tuya ya revisada. ¡Gracias!"
                : "traducciones tuyas ya revisadas. ¡Gracias!"}
            </p>
          </div>
        </div>
      </div>

      {/* Hero — mensaje al equipo de traducción ad honorem */}
      <section className="relative mt-5 overflow-hidden bg-[#BD0E0D] px-8 py-10 text-white">
        {/* "50" gigante de fondo */}
        <span
          className="pointer-events-none absolute -right-6 -top-10 select-none text-[200px] font-extrabold leading-none text-white/10"
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          aria-hidden="true"
        >
          50
        </span>

        <div className="relative max-w-2xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            Equipo de traducción · <Ila />
          </p>
          <h1
            className="mt-3 text-3xl font-extrabold leading-[1.15] md:text-4xl"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            Traducir <Ila /> es tender un puente entre 50 años de América
            Latina y el mundo hispanohablante.
          </h1>

          <p className="mt-5 leading-relaxed text-white/90">
            Durante más de medio siglo, <Ila /> viene haciendo periodismo
            independiente sobre América Latina, sin transar con los medios
            hegemónicos. Cada artículo que traducís abre ese archivo —memoria,
            análisis y voces— a la inmensa comunidad latinoamericana y a
            estudiantes, periodistas y ciudadanía a ambos lados del Atlántico.
          </p>
          <p className="mt-3 leading-relaxed text-white/90">
            Tu traducción no es un trabajo más: es tender un puente entre
            idiomas y generaciones, y dejar a quienes vienen un material de
            estudio y de lucha que de otro modo quedaría fuera de su alcance.
          </p>

          <p className="mt-6 flex items-center gap-2.5 text-lg font-bold">
            <FaGlobeAmericas className="text-white/90" />
            Gracias por ser parte de esta historia.
          </p>
        </div>
      </section>

      {/* Cómo empezar */}
      <Link
        href={`/${locale}/dashboard/translators/assignments`}
        className="group mt-6 flex items-start gap-4 border border-gray-200 bg-white px-5 py-4 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50"
      >
        <FaRegFileAlt className="mt-0.5 shrink-0 text-2xl text-[#BD0E0D]" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Mis Asignaciones
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            En esta sección tenés acceso a tus artículos asignados, desde donde
            podés traducirlos y enviarlos a revisión.
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#BD0E0D] group-hover:underline">
            Ir a mis asignaciones <FaArrowRight className="text-xs" />
          </span>
        </div>
      </Link>

      {/* Acceso exclusivo Digital ABO */}
      <Link
        href={`/${locale}/dashboard/translators/digital-abo`}
        className="group mt-6 flex items-start gap-4 border-2 border-cyan-400 bg-white px-5 py-4 shadow-[0_0_16px_3px_rgba(34,211,238,0.35)] transition-all hover:bg-cyan-50 dark:bg-gray-800/50"
      >
        <FaBookOpen className="mt-0.5 shrink-0 text-2xl text-cyan-500" />
        <div>
          <p
            className="text-lg font-extrabold leading-none tracking-tight"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            <span className="text-gray-900 dark:text-gray-100">DIGI</span>
            <span className="text-[#BD0E0D]">abo</span>
          </p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Como traductor/a tenés acceso <strong>exclusivo</strong> al Digital
            ABO: leé los dossiers completos en PDF, accedé a artículos antes de
            su publicación y armá tus propios Paketen PDF con tus favoritos.
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#BD0E0D] group-hover:underline">
            Entrar a mi Digital ABO <FaArrowRight className="text-xs" />
          </span>
        </div>
      </Link>

      {/* Feed del equipo: traducciones recién aprobadas y ya online */}
      {recentTranslations.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <FaUsers className="text-lg text-[#BD0E0D]" />
            <h2
              className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-100"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              Traducciones recientes del equipo
            </h2>
          </div>

          <ul className="divide-y divide-gray-200 border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {recentTranslations.map((a) => {
              const href = a.legacyPath
                ? `/${locale}${a.legacyPath}`
                : `/${locale}/articles/${a.id}`;
              const who = a.translator?.name?.split(" ")[0] || "un compañero";
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <FaCheckCircle className="mt-0.5 shrink-0 text-[#89B881]" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <Link
                        href={href}
                        target="_blank"
                        className="font-semibold text-gray-900 hover:text-[#BD0E0D] hover:underline dark:text-gray-100"
                      >
                        {a.titleES || a.title}
                      </Link>{" "}
                      <span className="text-gray-500 dark:text-gray-400">
                        — traducido por {who}, ya se puede leer online.
                      </span>
                    </p>
                    {a.edition?.number && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Ila /> {a.edition.number}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
