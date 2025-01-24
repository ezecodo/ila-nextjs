import ArticleListTest from "../../components/Articles/ArticleListTest";

// Ejemplo de artículos para pruebas
const mockArticles = [
  {
    id: 1,
    title: "Artículo Destacado",
    subtitle: "Este es el artículo destacado",
    images: [{ url: "/image1.jpg", alt: "Imagen 1" }],
    publicationDate: "2025-01-01",
  },
  {
    id: 2,
    title: "Artículo Secundario 1",
    subtitle: "Subtítulo Secundario 1",
    images: [{ url: "/image2.jpg", alt: "Imagen 2" }],
    publicationDate: "2025-01-02",
  },
  {
    id: 3,
    title: "Artículo Secundario 2",
    subtitle: "Subtítulo Secundario 2",
    images: [{ url: "/image3.jpg", alt: "Imagen 3" }],
    publicationDate: "2025-01-03",
  },
  {
    id: 4,
    title: "Artículo Pequeño 1",
    subtitle: "Subtítulo Pequeño 1",
    images: [{ url: "/image4.jpg", alt: "Imagen 4" }],
    publicationDate: "2025-01-04",
  },
  {
    id: 5,
    title: "Artículo Pequeño 2",
    subtitle: "Subtítulo Pequeño 2",
    images: [{ url: "/image5.jpg", alt: "Imagen 5" }],
    publicationDate: "2025-01-05",
  },
  {
    id: 6,
    title: "Artículo Pequeño 3",
    subtitle: "Subtítulo Pequeño 3",
    images: [{ url: "/image6.jpg", alt: "Imagen 6" }],
    publicationDate: "2025-01-06",
  },
  {
    id: 7,
    title: "Artículo Pequeño 4",
    subtitle: "Subtítulo Pequeño 4",
    images: [{ url: "/image7.jpg", alt: "Imagen 7" }],
    publicationDate: "2025-01-07",
  },
];

export default function TestPage() {
  return (
    <div>
      <h1>Prueba de Artículos</h1>
      <ArticleListTest articles={mockArticles} />
    </div>
  );
}
