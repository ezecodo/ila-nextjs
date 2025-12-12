// components/SectionHeader.tsx
interface SectionHeaderProps {
  title: string;
  className?: string;
}

export default function SectionHeader({
  title,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`relative overflow-hidden shadow-lg ${className}`}>
      <div className="bg-red-800 text-white px-6 py-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-white/30"></div>
        <h1 className="relative text-xl font-semibold tracking-wide flex items-center">
          <span className="mr-3">▶</span>
          {title}
        </h1>
      </div>
    </div>
  );
}
