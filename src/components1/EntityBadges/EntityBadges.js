import Link from "next/link";
import HoverInfo from "@/components/HoverInfo/HoverInfo";

export default function EntityBadges({ categories, regions, topics, context }) {
  return (
    <div className="badgeContainer flex flex-wrap gap-2">
      {/* 🔥 Regiones */}
      {regions?.map((region) => (
        <Link
          key={region.id}
          href={`/entities/regions/${region.id}`}
          className="regionBadge"
        >
          <HoverInfo
            id={region.id}
            name={region.name}
            entityType="regions"
            context={context} // ✅ Pasa "editions" cuando viene de EditionsList
          />
        </Link>
      ))}

      {/* 🔥 Topics */}
      {topics?.map((topic) => (
        <Link
          key={topic.id}
          href={`/entities/topics/${topic.id}`}
          className="topicBadge"
        >
          <HoverInfo
            id={topic.id}
            name={topic.name}
            entityType="topics"
            context={context} // ✅ Pasa "editions" cuando viene de EditionsList
          />
        </Link>
      ))}

      {/* 🔥 Categorías (solo si existen) */}
      {categories?.map((category) => (
        <Link
          key={category.id}
          href={`/entities/categories/${category.id}`}
          className="categoryBadge"
        >
          <HoverInfo
            id={category.id}
            name={category.name}
            entityType="categories"
            context={context} // ✅ Pasa "editions" cuando viene de EditionsList
          />
        </Link>
      ))}
    </div>
  );
}
