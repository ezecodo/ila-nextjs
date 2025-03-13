import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

const FavoriteButton = ({ articleId }) => {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // 🔄 Obtener datos de favoritos al cargar el componente
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `/api/articles/favorites?articleId=${articleId}&checkUser=${
            session ? "true" : "false"
          }`
        );

        if (!response.ok) {
          console.error("❌ Error en la API de favoritos:", response.status);
          return;
        }

        const data = await response.json();
        setFavorites(data.count || 0);
        setIsFavorited(data.isFavorited || false);
      } catch (error) {
        console.error("❌ Error al obtener datos de favoritos:", error);
      }
    };

    fetchFavorites();
  }, [articleId, session]);

  // 🔄 Alternar favorito
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
    } else {
      const errorData = await response.json();
      console.error("❌ Error en la API de favoritos:", errorData);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className="flex items-center gap-1 p-2 text-gray-500 hover:text-red-500 transition-transform hover:scale-110"
    >
      <Heart
        size={22}
        className={`text-red-500 fill-red-500 transition-all ${
          isFavorited ? "stroke-black stroke-[1.5]" : "stroke-none"
        }`}
      />
      <span className="text-xs">{favorites}</span>
    </button>
  );
};

export default FavoriteButton;
