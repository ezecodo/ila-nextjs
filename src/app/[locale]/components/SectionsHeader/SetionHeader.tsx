// components/SectionHeader.tsx
import LatinAmericaBackground from "../LatinAmericaBackground/LatinAmericaBackground";

interface SectionHeaderProps {
  title: string;
  className?: string;
  rightElement?: React.ReactNode;
}

export default function SectionHeader({
  title,
  className = "",
  rightElement,
}: SectionHeaderProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="bg-[#BD0E0D] text-white px-6 py-4 relative">
        {/* Fondo de países */}
        <LatinAmericaBackground variant="mobile" />

        {/* Contenido */}
        <div className="relative z-10 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-wide flex items-center">
            <span className="mr-3">▶</span>
            {title}
          </h1>
          {rightElement && (
            <div className="flex items-center">{rightElement}</div>
          )}
        </div>
      </div>
    </div>
  );
}
