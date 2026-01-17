// components/SectionHeader.tsx
import LatinAmericaBackground from "../LatinAmericaBackground/LatinAmericaBackground";

interface SectionHeaderProps {
  title: string;
  className?: string;
}

export default function SectionHeader({
  title,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="bg-[#e60000] text-white px-6 py-4 relative">
        {/* Fondo de países */}
        <LatinAmericaBackground variant="mobile" />

        {/* Contenido */}
        <h1 className="relative z-10 text-xl font-semibold tracking-wide flex items-center">
          <span className="mr-3">▶</span>
          {title}
        </h1>
      </div>
    </div>
  );
}
