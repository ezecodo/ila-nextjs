// components/StaticPageLayout.js
export default function StaticPageLayout({ title, children }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* título principal */}
      <h1 className="text-3xl md:text-4xl font-bold text-red-700 mb-8">
        {title}
      </h1>

      {/* contenido del texto */}
      <div className="prose prose-lg prose-red max-w-none">{children}</div>
    </div>
  );
}
