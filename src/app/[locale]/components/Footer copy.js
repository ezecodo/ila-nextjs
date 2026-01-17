"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter, // Extra por si acaso
  FaEnvelope,
  FaArrowRight,
} from "react-icons/fa";

// Asumo que usas CSS Modules, pero con Tailwind queda todo mucho más limpio.
// Si no tienes Tailwind, avísame y te doy el CSS puro.
import styles from "./Footer.module.css";

const Footer = () => {
  // Nota: Aquí podrías usar 'useTranslations' como en el header:
  // const t = useTranslations("footer");

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* GRID SUPERIOR: 4 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* COLUMNA 1: SOBRE NOSOTROS / BRANDING */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {/* Si tienes el componente IlaLogo, úsalo aquí, si no, la imagen */}
              <Image
                src="/ila-logo.png"
                alt="ila logo"
                width={40}
                height={40}
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
              <span className="text-xl font-bold tracking-wider text-white">
                ila
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Informationsstelle Lateinamerika e.V. La plataforma de referencia
              para el análisis político, social y cultural de América Latina.
            </p>
            <div className="pt-2">
              <Link
                href="/contacto"
                className="inline-flex items-center text-sm font-bold text-white border-b-2 border-red-600 hover:text-red-500 transition-colors pb-1"
              >
                Contáctanos <FaArrowRight className="ml-2 text-xs" />
              </Link>
            </div>
          </div>

          {/* COLUMNA 2: LA REVISTA */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 border-l-2 border-red-600 pl-3">
              Revista
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/editions/latest"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-red-600 transition-colors"></span>
                  Edición Actual
                </Link>
              </li>
              <li>
                <Link
                  href="/archive"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-red-600 transition-colors"></span>
                  Archivo Histórico
                </Link>
              </li>
              <li>
                <Link
                  href="/subscribe"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-red-600 transition-colors"></span>
                  Suscripción
                </Link>
              </li>
              <li>
                <Link
                  href="/authors"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-red-600 transition-colors"></span>
                  Autores y Colaboradores
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMNA 3: ASOCIACIÓN Y RECURSOS */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 border-l-2 border-red-600 pl-3">
              Asociación
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about-us"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                >
                  ¿Quiénes somos?
                </Link>
              </li>
              <li>
                <Link
                  href="/statutes"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                >
                  Estatutos
                </Link>
              </li>
              <li>
                <Link
                  href="/members"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                >
                  Hazte Socio
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm font-semibold"
                >
                  Donar / Apoyar
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMNA 4: LEGAL Y SOCIAL */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 border-l-2 border-red-600 pl-3">
              Legal
            </h3>
            <ul className="space-y-3 mb-6">
              <li>
                <Link
                  href="/impressum"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Términos y Condiciones
                </Link>
              </li>
            </ul>

            {/* REDES SOCIALES */}
            <div className="flex gap-4">
              <Link
                href="https://www.facebook.com/ila.web"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300"
                aria-label="Facebook"
              >
                <FaFacebook />
              </Link>
              <Link
                href="https://www.instagram.com/ila_bonn/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300"
                aria-label="Instagram"
              >
                <FaInstagram />
              </Link>
              {/* Añadí Twitter/X como ejemplo extra */}
              <Link
                href="#"
                className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300"
                aria-label="X / Twitter"
              >
                <FaTwitter />
              </Link>
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR (COPYRIGHT) */}
        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs text-center md:text-left">
            © {new Date().getFullYear()}{" "}
            <span className="text-gray-500 font-semibold">ila</span> –
            Informationsstelle Lateinamerika e.V. Bonn. Todos los derechos
            reservados.
          </p>

          <div className="flex gap-6 text-xs text-gray-600 font-medium uppercase tracking-wide">
            <Link
              href="/sitemap"
              className="hover:text-red-500 transition-colors"
            >
              Mapa del sitio
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-red-500 transition-colors"
            >
              Accesibilidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
