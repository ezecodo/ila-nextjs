import Link from "next/link";
import HoverInfo from "@/components/HoverInfo/HoverInfo";

export default function EntityBadges({ categories, regions, topics }) {
  return (
    <div className="badgeContainer flex flex-wrap gap-2">
      {/* 🔥 Categorías */}
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
          />
        </Link>
      ))}

      {/* 🔥 Regiones */}
      {regions?.map((region) => (
        <Link
          key={region.id}
          href={`/entities/regions/${region.id}`}
          className="regionBadge"
        >
          <HoverInfo id={region.id} name={region.name} entityType="regions" />
        </Link>
      ))}

      {/* 🔥 Topics */}
      {topics?.map((topic) => (
        <Link
          key={topic.id}
          href={`/entities/topics/${topic.id}`}
          className="topicBadge"
        >
          <HoverInfo id={topic.id} name={topic.name} entityType="topics" />
        </Link>
      ))}
    </div>
  );
}
