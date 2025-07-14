"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

export default function ArticleLink({ article, children, className = "" }) {
  const locale = useLocale();

  // Si el artículo tiene una ruta legacy, usarla
  const href = article.legacyPath
    ? `/${locale}${article.legacyPath}`
    : `/${locale}/articles/${article.id}`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
