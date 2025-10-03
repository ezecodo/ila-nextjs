"use client";

import IlaLoader from "../components/IlaLoader/IlaLoader";
import { useState, useEffect } from "react";
import { Save, Trash2, Download, Upload } from "lucide-react";

export default function LoaderPreviewPage() {
  // Estados base
  const [size, setSize] = useState(150);
  const [speed, setSpeed] = useState(1.2);
  const [shape, setShape] = useState("circle");
  const [color, setColor] = useState("#e63946");
  const [textColor, setTextColor] = useState("#e63946");
  const [glow, setGlow] = useState(false);
  const [bgDark, setBgDark] = useState(false);
  const [animationType, setAnimationType] = useState("spin");
  const [rainbowMode, setRainbowMode] = useState(false);

  // Estados para guardar configuraciones
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [configName, setConfigName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Cargar configuraciones guardadas al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("ilaLoaderConfigs");
    if (saved) {
      setSavedConfigs(JSON.parse(saved));
    }
  }, []);

  // Guardar en localStorage cada vez que cambian las configuraciones
  useEffect(() => {
    if (savedConfigs.length > 0) {
      localStorage.setItem("ilaLoaderConfigs", JSON.stringify(savedConfigs));
    }
  }, [savedConfigs]);

  // Función para guardar la configuración actual
  const saveCurrentConfig = () => {
    if (!configName.trim()) {
      alert("Por favor, ingresa un nombre para la configuración");
      return;
    }

    const newConfig = {
      id: Date.now(),
      name: configName,
      size,
      speed,
      shape,
      color,
      textColor,
      glow,
      animationType,
      rainbowMode,
      createdAt: new Date().toISOString(),
    };

    setSavedConfigs([...savedConfigs, newConfig]);
    setConfigName("");
    setShowSaveModal(false);
  };

  // Función para cargar una configuración guardada
  const loadConfig = (config) => {
    setSize(config.size);
    setSpeed(config.speed);
    setShape(config.shape);
    setColor(config.color);
    setTextColor(config.textColor);
    setGlow(config.glow);
    setAnimationType(config.animationType);
    setRainbowMode(config.rainbowMode);
  };

  // Función para eliminar una configuración
  const deleteConfig = (id) => {
    if (confirm("¿Estás seguro de eliminar esta configuración?")) {
      setSavedConfigs(savedConfigs.filter((config) => config.id !== id));
    }
  };

  // Función para exportar configuración como JSON
  const exportConfig = () => {
    const config = {
      size,
      speed,
      shape,
      color,
      textColor,
      glow,
      animationType,
      rainbowMode,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ila-loader-config-${Date.now()}.json`;
    a.click();
  };

  // Presets
  const presets = [
    {
      name: "Clásico",
      size: 150,
      speed: 1.2,
      shape: "circle",
      color: "#e63946",
      glow: false,
      animationType: "spin",
      rainbow: false,
    },
    {
      name: "Rápido",
      size: 140,
      speed: 0.8,
      shape: "circle",
      color: "#06b6d4",
      glow: true,
      animationType: "spin",
      rainbow: false,
    },
    {
      name: "Elegante",
      size: 180,
      speed: 2,
      shape: "rounded",
      color: "#8b5cf6",
      glow: false,
      animationType: "spin",
      rainbow: false,
    },
    {
      name: "Neón",
      size: 200,
      speed: 1.5,
      shape: "circle",
      color: "#10b981",
      glow: true,
      animationType: "pulse",
      rainbow: false,
    },
    {
      name: "🗺️ Latam",
      size: 200,
      speed: 1.8,
      shape: "latinamerica",
      color: "#059669",
      glow: true,
      animationType: "spin",
      rainbow: false,
    },
    {
      name: "🏳️‍🌈 Pride",
      size: 180,
      speed: 1.5,
      shape: "circle",
      color: "#FF0000",
      glow: true,
      animationType: "spin",
      rainbow: true,
    },
  ];

  const applyPreset = (preset) => {
    setSize(preset.size);
    setSpeed(preset.speed);
    setShape(preset.shape);
    setColor(preset.color);
    setTextColor(preset.color);
    setGlow(preset.glow);
    setAnimationType(preset.animationType);
    setRainbowMode(preset.rainbow);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Loader Preview
          </h1>
          <p className="text-gray-600">Personaliza tu loader en tiempo real</p>
        </div>

        {/* Presets rápidos */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="font-semibold mb-3 text-gray-700 text-sm">
            ⚡ Presets rápidos
          </h2>
          <div className="flex gap-2 flex-wrap">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-all hover:scale-105"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Contenedor principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vista previa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Vista previa</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBgDark(!bgDark)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    {bgDark ? "🌙" : "☀️"}
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <Save size={14} />
                    Guardar
                  </button>
                  <button
                    onClick={exportConfig}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <Download size={14} />
                    Exportar
                  </button>
                </div>
              </div>
              <div
                className={`flex justify-center items-center h-80 rounded-lg shadow-inner transition-colors duration-300 ${
                  bgDark ? "bg-gray-900" : "bg-gray-50"
                }`}
              >
                <IlaLoader
                  size={size}
                  speed={speed}
                  shape={shape}
                  color={color}
                  textColor={textColor}
                  glow={glow}
                  animationType={animationType}
                  rainbowMode={rainbowMode}
                />
              </div>
            </div>

            {/* Configuraciones guardadas */}
            {savedConfigs.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  💾 Mis configuraciones guardadas
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {savedConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-red-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {config.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(config.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteConfig(config.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-600 mb-3">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {config.size}px
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {config.speed}s
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {config.shape}
                        </span>
                        {config.rainbowMode && (
                          <span className="bg-gradient-to-r from-red-100 to-purple-100 px-2 py-1 rounded">
                            🏳️‍🌈
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => loadConfig(config)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition-colors"
                      >
                        Cargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-700 mb-4">
              ⚙️ Configuración
            </h3>

            <div className="flex flex-col gap-5">
              {/* Tamaño */}
              <div>
                <label className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Tamaño</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {size}px
                  </span>
                </label>
                <input
                  type="range"
                  min="80"
                  max="300"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              {/* Velocidad */}
              <div>
                <label className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Velocidad</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {speed}s
                  </span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              {/* Toggle Modo Rainbow */}
              <div className="bg-gradient-to-r from-red-100 via-yellow-100 to-purple-100 p-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rainbowMode}
                    onChange={(e) => setRainbowMode(e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span className="font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 bg-clip-text text-transparent">
                    🏳️‍🌈 Modo Pride
                  </span>
                </label>
              </div>

              {/* Colores */}
              <div
                className={`grid grid-cols-2 gap-3 ${rainbowMode ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div>
                  <label className="block font-medium text-gray-700 mb-2 text-sm">
                    Color borde
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                    disabled={rainbowMode}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2 text-sm">
                    Color texto
                  </label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                    disabled={rainbowMode}
                  />
                </div>
              </div>

              {/* Forma */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Forma
                </label>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="circle">Círculo</option>
                  <option value="square">Cuadrado</option>
                  <option value="rounded">Redondeado</option>
                  <option value="latinamerica">🗺️ América Latina</option>
                </select>
              </div>

              {/* Animación */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Animación
                </label>
                <select
                  value={animationType}
                  onChange={(e) => setAnimationType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="spin">Rotación</option>
                  <option value="pulse">Pulso</option>
                  <option value="bounce">Rebote</option>
                  <option value="wobble">Oscilación</option>
                </select>
              </div>

              {/* Efecto glow */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={glow}
                    onChange={(e) => setGlow(e.target.checked)}
                    className="w-4 h-4 accent-red-500"
                  />
                  <span className="font-medium text-gray-700">
                    Efecto brillo (glow)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>💡 Tip:</strong> Cuando encuentres una configuración que te
          guste, haz clic en "Guardar" para poder usarla más tarde
        </div>
      </div>

      {/* Modal para guardar configuración */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Guardar configuración</h3>
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Nombre de la configuración..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              onKeyPress={(e) => e.key === "Enter" && saveCurrentConfig()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCurrentConfig}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
