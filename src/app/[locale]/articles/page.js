import ArticleList from "../components/Articles/ArticleList";
import { useTranslations } from "next-intl";

export default function ArticlesPage() {
  const t = useTranslations("article");
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">{t("articles")}</h2>
      <ArticleList />
    </div>
  );
}
