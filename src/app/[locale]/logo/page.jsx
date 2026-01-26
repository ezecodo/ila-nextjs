// app/[locale]/logo/page.jsx

"use client";

import { useState } from "react";
import IlaLogo50 from "../components/IlaLogo/ilaLogo50";

export default function TestLogoPage() {
  const [size, setSize] = useState("large");
  const [show50, setShow50] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [animationType, setAnimationType] = useState("hover-scale");
  const [bgColor, setBgColor] = useState("#cc0000");
  const [key, setKey] = useState(0);

  const resetAnimation = () => setKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-white text-2xl font-bold mb-6 text-center">
        🎨 Configurador Logo ila 50
      </h1>

      {/* Panel de controles */}
      <div className="max-w-2xl mx-auto mb-8 p-6 bg-gray-800 rounded-xl space-y-4">
        {/* Fila 1: Tamaño y Color */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="text-gray-400 text-sm block mb-2">Tamaño</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
            >
              <option value="mini">Mini</option>
              <option value="compact">Compact</option>
              <option value="default">Default</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-gray-400 text-sm block mb-2">
              Color fondo
            </label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
            />
          </div>
        </div>

        {/* Fila 2: Animación */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-gray-400 text-sm block mb-2">
              Tipo de animación
            </label>
            <select
              value={animationType}
              onChange={(e) => {
                setAnimationType(e.target.value);
                resetAnimation();
              }}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
            >
              <optgroup label="Básicas">
                <option value="none">Sin animación</option>
                <option value="hover-scale">Hover Scale</option>
                <option value="entrance">Entrada (fade in)</option>
                <option value="entrance-stagger">Entrada escalonada</option>
                <option value="pulse">Pulse / Latido</option>
                <option value="float">Flotante</option>
                <option value="glow">Hover Glow</option>
              </optgroup>
              <optgroup label="🏳️‍🌈 LGBT+">
                <option value="lgbt-gradient">Gradiente Arcoíris</option>
                <option value="lgbt-hover">Hover Rainbow</option>
                <option value="lgbt-glow">Rainbow Glow</option>
                <option value="lgbt-pulse">Pride Pulse</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Fila 3: Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={show50}
              onChange={(e) => setShow50(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Mostrar 50</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={animated}
              onChange={(e) => setAnimated(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Animado</span>
          </label>
        </div>

        {/* Botón reiniciar */}
        <button
          onClick={resetAnimation}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          🔄 Reiniciar animación
        </button>
      </div>

      {/* Preview del logo */}
      <div
        className="max-w-2xl mx-auto rounded-2xl p-16 flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: bgColor }}
      >
        <IlaLogo50
          key={key}
          size={size}
          show50={show50}
          animated={animated}
          animationType={animationType}
          isLink={false}
        />
      </div>

      {/* Info */}
      <p className="text-center text-gray-500 text-sm mt-6">
        Configuración actual: size="{size}" | animationType="{animationType}" |
        show50={show50.toString()}
      </p>
    </div>
  );
}
