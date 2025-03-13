import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

const FavoriteButton = ({ articleId }) => {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `/api/articles/favorites?articleId=${articleId}&checkUser=true`
        );
        const data = await response.json();
        setFavorites(data.count || 0); // ✅ Asegura que el número de likes siempre sea correcto
        setIsFavorited(data.isFavorited || false); // ✅ Asegura que el estado de like es correcto
      } catch (error) {
        console.error("Error al obtener datos de favoritos:", error);
      }
    };

    fetchFavorites();
  }, [articleId, session]); // ✅ Se actualiza cuando cambia el usuario o el artículo

  const toggleFavorite = async () => {
    if (!session) {
      alert("Debes iniciar sesión para marcar favoritos.");
      return;
    }

    const method = isFavorited ? "DELETE" : "POST";

    try {
      const response = await fetch(`/api/articles/favorites`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });

      if (response.ok) {
        // ✅ Una vez que se hace POST o DELETE, volvemos a hacer fetch para obtener datos actualizados
        const updatedData = await response.json();
        setFavorites(updatedData.count || 0); // ✅ Se actualiza el contador
        setIsFavorited(!isFavorited);
      } else {
        console.error("Error en la API de favoritos:", await response.json());
      }
    } catch (error) {
      console.error("❌ Error al actualizar favoritos:", error);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className="flex items-center gap-1 p-2 text-gray-500 hover:text-red-500 transition-transform hover:scale-110"
    >
      <Heart
        size={22}
        className={`transition-all ${
          isFavorited
            ? "text-red-500 fill-red-500"
            : "text-gray-400 hover:text-red-500 hover:fill-red-500"
        }`}
      />
      <span className="text-xs">{favorites}</span>
    </button>
  );
};

export default FavoriteButton;
