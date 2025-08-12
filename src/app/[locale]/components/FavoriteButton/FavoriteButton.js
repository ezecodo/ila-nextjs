"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";

const FavoriteButton = ({ articleId, variant = "shareBar" }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/articles/favorites?articleId=${articleId}&checkUser=true`
        );
        const data = await res.json();
        setFavorites(data.count || 0);
        setIsFavorited(!!data.isFavorited);
      } catch (err) {
        console.error("Error al obtener datos de favoritos:", err);
      }
    };
    fetchData();
  }, [articleId, session]);

  const toggleFavorite = async (e) => {
    e.preventDefault();

    if (!session) {
      const shouldRegister = window.confirm(
        "Para guardar un artículo debes estar registrado. ¿Quieres registrarte y acceder a todas las ventajas de ser parte de ila?"
      );
      if (shouldRegister) router.push("/auth/register");
      return;
    }

    const method = isFavorited ? "DELETE" : "POST";

    const res = await fetch(`/api/articles/favorites`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    });

    if (res.ok) {
      setFavorites((prev) => (isFavorited ? prev - 1 : prev + 1));
      setIsFavorited(!isFavorited);
      setClicked(true);
      setTimeout(() => setClicked(false), 300);
    } else {
      const errorData = await res.json();
      console.error("Error en la API de favoritos:", errorData);
    }
  };

  const buttonClass =
    variant === "shareBar"
      ? "bg-white border border-red-500 text-red-600 p-2 rounded hover:bg-red-50 transition flex items-center justify-center leading-none"
      : variant === "icon"
        ? "bg-transparent p-0 m-0 border-0 flex items-center justify-center leading-none"
        : "bg-transparent p-1 transition-transform hover:scale-110 flex items-center justify-center leading-none";

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={toggleFavorite}
        className={`${buttonClass} ${clicked ? "animate-ping-once" : ""}`}
        aria-label={isFavorited ? "Quitar de favoritos" : "Añadir a favoritos"}
        title={isFavorited ? "Quitar de favoritos" : "Añadir a favoritos"}
        aria-pressed={isFavorited}
      >
        {isFavorited ? <FaBookmark size={20} /> : <FaRegBookmark size={20} />}
      </button>

      {showTooltip && favorites > 0 && (
        <div className="absolute -top-2 left-4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-md z-10">
          {favorites}
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
