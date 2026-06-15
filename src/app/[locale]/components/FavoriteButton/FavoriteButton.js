"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import { useTranslations } from "next-intl";

const FavoriteButton = ({ articleId, variant = "shareBar", onRemoved }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("favorites");
  const [favorites, setFavorites] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef(null);
  const confirmRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // 🔥 DETECCIÓN DE ESTILO: Para saber si estamos en la barra roja nueva
  const isIconVariant = variant === "icon";
  const iconSize = variant === "mini" ? 14 : 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/articles/favorites?articleId=${articleId}&checkUser=true`,
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

  const closeModal = () => {
    setShowModal(false);
  };

  const applyFavorite = async (shouldFavorite) => {
    const method = shouldFavorite ? "POST" : "DELETE";

    const res = await fetch(`/api/articles/favorites`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    });

    if (res.ok) {
      setFavorites((prev) => (shouldFavorite ? prev + 1 : prev - 1));
      setIsFavorited(shouldFavorite);
      setClicked(true);
      setTimeout(() => setClicked(false), 300);
    } else {
      const errorData = await res.json();
      console.error("Error en la API de favoritos:", errorData);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      setShowModal(true);
      return;
    }

    // Confirmar antes de quitar de favoritos
    if (isFavorited) {
      setShowRemoveConfirm(true);
      return;
    }

    await applyFavorite(true);
  };

  const closeRemoveConfirm = () => setShowRemoveConfirm(false);

  const confirmRemove = async () => {
    setShowRemoveConfirm(false);
    await applyFavorite(false);
    onRemoved?.(articleId);
  };

  const buttonClass =
    variant === "shareBar"
      ? "bg-white border border-red-500 text-red-600 p-2 rounded hover:bg-red-50 transition flex items-center justify-center leading-none"
      : variant === "icon"
        ? "p-0 m-0 border-0 flex items-center justify-center leading-none text-white hover:text-white/70 transition-all duration-300"
        : variant === "mini"
          ? "text-red-600 p-1 flex items-center justify-center leading-none transition-all duration-300"
          : "text-red-600 p-1.5 flex items-center justify-center leading-none transition-all duration-300";

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3"
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeModal();
        }
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-xs bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
      >
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-4 text-center relative">
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
            aria-label="Cerrar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <FaBookmark className="w-8 h-8 text-white mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white">{t("modalTitle")}</h3>
        </div>

        {/* Contenido */}
        <div className="px-4 py-4">
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-3">
            {t("modalDescription")}
          </p>

          {/* Beneficios inline */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t("benefit1")}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t("benefit2")}
            </span>
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <button
              onClick={() => {
                closeModal();
                router.push("/auth/signup");
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2 px-4 text-sm"
            >
              {t("registerButton")}
            </button>
            <button
              onClick={() => {
                closeModal();
                router.push("/auth/signin");
              }}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 text-sm"
            >
              {t("loginButton")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const removeConfirmContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3"
      onMouseDown={(e) => {
        if (confirmRef.current && !confirmRef.current.contains(e.target)) {
          closeRemoveConfirm();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        ref={confirmRef}
        className="relative z-10 w-full max-w-xs bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-5 text-center">
          <FaBookmark className="w-7 h-7 text-[#BD0E0D] mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t("removeConfirmTitle")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            {t("removeConfirmDescription")}
          </p>
        </div>
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeRemoveConfirm();
            }}
            className="flex-1 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {t("removeConfirmCancel")}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              confirmRemove();
            }}
            className="flex-1 py-3 text-sm font-bold text-white bg-[#BD0E0D] hover:bg-[#a50c0b] transition-colors border-l border-gray-200 dark:border-gray-700"
          >
            {t("removeConfirmYes")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={toggleFavorite}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`${buttonClass} ${clicked ? "animate-ping-once" : ""}`}
          aria-label={
            isFavorited ? "Quitar de favoritos" : "Añadir a favoritos"
          }
          title={isFavorited ? "Quitar de favoritos" : "Añadir a favoritos"}
          aria-pressed={isFavorited}
        >
          {isFavorited || isHovered ? (
            <FaBookmark
              size={iconSize}
              className="text-current transition-colors"
            />
          ) : (
            <FaRegBookmark
              size={iconSize}
              className="text-current transition-colors"
            />
          )}
        </button>

        {/* BADGE DEL CONTADOR */}
        {showTooltip && favorites > 0 && (
          <div
            className={`absolute -top-2 left-4 shadow-md z-10 transition-transform ${
              isIconVariant
                ? "bg-white text-red-600" // 🔥 Badge Blanco/Rojo para fondo Rojo
                : "bg-red-500 text-white" // Badge Rojo/Blanco para fondo Blanco
            } text-[10px] px-1.5 py-0.5 rounded-full`}
          >
            {favorites}
          </div>
        )}
      </div>

      {/* Modal con Portal */}
      {mounted && showModal && createPortal(modalContent, document.body)}

      {/* Confirmación de quitar de favoritos */}
      {mounted &&
        showRemoveConfirm &&
        createPortal(removeConfirmContent, document.body)}
    </>
  );
};

export default FavoriteButton;
