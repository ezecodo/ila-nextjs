import Link from "next/link";
import HoverInfo from "../HoverInfo/HoverInfo";

export default function EntityBadges({
  categories,
  regions,
  topics,
  context,
  locale,
  className = "",
}) {
  const badgeClasses =
    "text-[11px] px-2 py-[1px] rounded-none bg-white/80 text-gray-800 font-normal shadow-sm border border-gray-300";

  return (
    <div className={`badgeContainer flex flex-wrap gap-[4px] ${className}`}>
      {/* 🔥 Regiones */}
      {regions?.map((region) => (
        <Link
          key={region.id}
          href={`/entities/regions/${region.id}`}
          className={badgeClasses}
        >
          <HoverInfo
            id={region.id}
            name={
              locale === "es" && region.nameES ? region.nameES : region.name
            }
            entityType="regions"
            context={context}
          />
        </Link>
      ))}

      {/* 🔥 Topics */}
      {topics?.map((topic) => (
        <Link
          key={topic.id}
          href={`/entities/topics/${topic.id}`}
          className={badgeClasses}
        >
          <HoverInfo
            id={topic.id}
            name={locale === "es" && topic.nameES ? topic.nameES : topic.name}
            entityType="topics"
            context={context}
          />
        </Link>
      ))}

      {/* 🔥 Categorías */}
      {categories?.map((category) => (
        <Link
          key={category.id}
          href={`/entities/categories/${category.id}`}
          className={badgeClasses}
        >
          <HoverInfo
            id={category.id}
            name={category.name}
            entityType="categories"
            context={context}
          />
        </Link>
      ))}
    </div>
  );
}
