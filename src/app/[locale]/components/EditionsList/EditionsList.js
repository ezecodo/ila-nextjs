"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import HoverInfo from "../HoverInfo/HoverInfo";
import EntityBadges from "../EntityBadges/EntityBadges"; // ✅ Importamos el nuevo EntityBadges
import { useTranslations } from "next-intl";

export default function EditionsList() {
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);
  const t = useTranslations("dossiers");

  useEffect(() => {
    async function fetchEditions() {
      try {
        const response = await fetch("/api/editions");
        if (!response.ok) {
          throw new Error(t("editionsError"));
        }
        const data = await response.json();

        // Ordenar ediciones por número en orden descendente
        const sortedEditions = data.sort((a, b) => b.number - a.number);

        setEditions(sortedEditions);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEditions();
  }, []);

  const openPopup = (imageUrl) => {
    setPopupImage(imageUrl);
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setPopupImage(null);
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (editions.length === 0) {
    return <p>{t("noEditions")}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {editions.map((edition) => (
          <div
            key={edition.id}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center"
          >
            {/* Contenedor de la imagen */}
            <div
              className="relative w-full max-w-[300px] cursor-pointer"
              onClick={() =>
                edition.coverImage && openPopup(edition.coverImage)
              }
            >
              <div className="relative overflow-hidden aspect-w-3 aspect-h-4">
                {/* Imagen de la portada */}
                <Image
                  src={edition.coverImage}
                  alt={`Portada de ${edition.title}`}
                  width={300}
                  height={400}
                  objectFit="contain"
                />

                {/* Ícono del carrito */}
                {edition.isAvailableToOrder && (
                  <div className="absolute top-2 right-2 z-10">
                    <i className="fa fa-shopping-cart text-white text-xl bg-red-600 p-1 shadow-lg transition-all duration-200 ease-in-out hover:bg-red-800 hover:scale-110"></i>
                  </div>
                )}
              </div>
            </div>
            {/* Número de edición + Título con HoverInfo */}
            <HoverInfo
              id={edition.id}
              name={
                <h2 className="text-lg font-bold mt-4 mb-2 flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: "Futura, sans-serif",
                      textTransform: "lowercase",
                      fontSize: "1.2em",
                      color: "#d13120",
                    }}
                  >
                    ila {edition.number}
                  </span>
                  {edition.title}
                </h2>
              }
              entityType="editions"
            />

            {/* 🔥 Reemplazo de badges manuales por EntityBadges */}
            <EntityBadges
              regions={edition.regions}
              topics={edition.topics}
              entityType="editions" // ✅ Indica que es para ediciones
              context="editions" // 🔥 Asegura que HoverInfo cuente ediciones
            />

            {/* Mostrar texto truncado */}
            <p className="text-gray-700">
              {truncateText(edition.summary, 150)}
            </p>

            {/* Link para leer más */}
            <Link
              href={`/editions/${edition.id}`}
              className="text-blue-500 font-medium mt-2 inline-block"
            >
              {t("readMore")}
            </Link>
          </div>
        ))}
      </div>

      {/* Modal de Headless UI */}
      <Dialog
        open={isOpen}
        onClose={closePopup}
        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-70"
      >
        <Dialog.Panel className="relative bg-white rounded-lg shadow-lg p-4 max-w-[500px]">
          {/* Imagen ampliada */}
          {popupImage && (
            <Image
              src={popupImage}
              alt="Imagen ampliada"
              width={500}
              height={700}
              objectFit="contain" // 🔥 Ajusta la imagen al contenedor
            />
          )}
          {/* Botón de cierre */}
          <button
            className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-800 text-xl font-bold w-8 h-8 flex items-center justify-center shadow-lg"
            onClick={closePopup}
          >
            ✕
          </button>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
