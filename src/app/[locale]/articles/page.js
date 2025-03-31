import ArticleList from "@/components/Articles/ArticleList";

export default function ArticlesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Artículos</h2>
      <ArticleList />
    </div>
  );
}
