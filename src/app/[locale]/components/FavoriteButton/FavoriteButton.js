import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

const FavoriteButton = ({ articleId, onRemoveFavorite }) => {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/articles/favorites?articleId=${articleId}&checkUser=true`
        );
        const data = await response.json();
        setFavorites(data.count || 0);
        setIsFavorited(data.isFavorited || false);
      } catch (error) {
        console.error("Error al obtener datos de favoritos:", error);
      }
    };

    fetchData();
  }, [articleId, session]);

  const toggleFavorite = async () => {
    if (!session) {
      alert("Debes iniciar sesión para marcar favoritos.");
      return;
    }

    const method = isFavorited ? "DELETE" : "POST";

    const response = await fetch(`/api/articles/favorites`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    });

    if (response.ok) {
      setFavorites((prev) => (isFavorited ? prev - 1 : prev + 1));
      setIsFavorited(!isFavorited);

      // ✅ Si está en la lista de favoritos, lo eliminamos visualmente sin recargar
      if (isFavorited && onRemoveFavorite) {
        onRemoveFavorite(articleId);
      }
    } else {
      const errorData = await response.json();
      console.error("Error en la API de favoritos:", errorData);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className="flex items-center gap-1 p-2 transition-transform hover:scale-110"
    >
      <Heart
        size={22}
        className={`transition-all ${
          isFavorited
            ? "text-red-500 fill-red-500 stroke-black" // 🔥 Contorno negro cuando es favorito
            : "text-red-500 hover:text-red-500 hover:fill-red-500" // 🔥 Siempre en rojo
        }`}
      />
      <span className="text-xs">{favorites}</span>
    </button>
  );
};

export default FavoriteButton;
