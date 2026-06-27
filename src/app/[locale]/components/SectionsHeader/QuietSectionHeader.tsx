// Cabezal "silencioso" estilo editorial (Guardian/Zeit): sin barra rellena.
// Dos variantes:
//   - "line" (default): filete rojo de marca arriba + título sans + borde inferior fino.
//   - "chip": el rojo de marca va SOLO detrás del título (rectángulo tipo caja "ila"),
//     sin línea a todo el ancho. Menos presencia visual que la línea entera.
// Pensado para módulos de columna (Aktuelles / Veranstaltungen) y carruseles.
interface QuietSectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  className?: string;
  variant?: "line" | "chip";
}

export default function QuietSectionHeader({
  title,
  rightElement,
  className = "",
  variant = "line",
}: QuietSectionHeaderProps) {
  if (variant === "chip") {
    return (
      <div className={className}>
        <div className="flex items-start">
          <h2 className="min-w-0 inline-block bg-[#BD0E0D] text-white text-sm font-bold uppercase tracking-[0.12em] px-3 py-1.5 break-words">
            {title}
          </h2>
          {/* Línea que nace pegada al chip y abarca todo el ancho */}
          <span
            aria-hidden="true"
            className="flex-1 min-w-[24px] border-t-2 border-[#BD0E0D]"
          />
        </div>
        {/* El link queda por debajo de la línea, alineado a la derecha */}
        {rightElement && (
          <div className="flex justify-end mt-1.5">{rightElement}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`border-t-2 border-[#BD0E0D] ${className}`}>
      <div className="flex items-center justify-between gap-3 pt-2.5 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {rightElement}
      </div>
    </div>
  );
}
