"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { countryToRegionId, countryColors, countryNames } from "./countryData";

const countryCoordinates = {
  MEX: { lat: 23.6345, lon: -102.5528 },
  GTM: { lat: 15.7835, lon: -90.2308 },
  BLZ: { lat: 17.1899, lon: -88.4976 },
  HND: { lat: 15.2, lon: -86.2419 },
  SLV: { lat: 13.7942, lon: -88.8965 },
  NIC: { lat: 12.8654, lon: -85.2072 },
  CRI: { lat: 9.7489, lon: -83.7534 },
  PAN: { lat: 8.538, lon: -80.7821 },
  COL: { lat: 4.5709, lon: -74.2973 },
  VEN: { lat: 6.4238, lon: -66.5897 },
  ECU: { lat: -1.8312, lon: -78.1834 },
  PER: { lat: -9.19, lon: -75.0152 },
  BOL: { lat: -16.2902, lon: -63.5887 },
  BRA: { lat: -14.235, lon: -51.9253 },
  PRY: { lat: -23.4425, lon: -58.4438 },
  URY: { lat: -32.5228, lon: -55.7658 },
  ARG: { lat: -38.4161, lon: -63.6167 },
  CHL: { lat: -35.6751, lon: -71.543 },
  GUY: { lat: 4.8604, lon: -58.9302 },
  SUR: { lat: 3.9193, lon: -56.0278 },
  GUF: { lat: 3.9339, lon: -53.1258 },
  CUB: { lat: 21.5218, lon: -77.7812 },
  JAM: { lat: 18.1096, lon: -77.2975 },
  HTI: { lat: 18.9712, lon: -72.2852 },
  DOM: { lat: 18.7357, lon: -70.1627 },
  PRI: { lat: 18.2208, lon: -66.5901 },
  TTO: { lat: 10.6918, lon: -61.2225 },
  USA: { lat: 37.0902, lon: -95.7129 },
  CAN: { lat: 56.1304, lon: -106.3468 },
};

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function GlobeMap() {
  const mountRef = useRef(null);
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const frameRef = useRef({ animationId: null });

  // Panel lateral con la lista clickeable de artículos del país
  const [panel, setPanel] = useState(null); // { code, name, regionId }
  const [panelData, setPanelData] = useState({
    loading: false,
    articles: [],
    total: 0,
  });
  const panelCacheRef = useRef({});
  const panelContentRef = useRef(null);

  // El portal necesita document.body, que no existe en el render del servidor.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Portadas de dossiers para el fondo (mismo patrón que el popup de donación)
  const [covers, setCovers] = useState([]);
  useEffect(() => {
    fetch("/api/editions?limit=20")
      .then((r) => r.json())
      .then((data) => {
        const imgs = (data || [])
          .map((d) => d.coverImage)
          .filter(Boolean)
          .sort(() => Math.random() - 0.5);
        setCovers(imgs);
      })
      .catch((err) => console.error("Error cargando portadas:", err));
  }, []);

  const openPanel = async (countryCode) => {
    const regionId = countryToRegionId[countryCode];
    if (!regionId) return;

    const name =
      countryNames[countryCode]?.[locale] ||
      countryNames[countryCode]?.de ||
      countryCode;
    setPanel({ code: countryCode, name, regionId });

    const cached = panelCacheRef.current[countryCode];
    if (cached) {
      setPanelData({ loading: false, ...cached });
      return;
    }

    setPanelData({ loading: true, articles: [], total: 0 });
    try {
      const first = await fetch(
        `/api/entities/regions/${regionId}?page=1`
      ).then((r) => r.json());
      let articles = first.articles || [];
      const total = first.totalArticles ?? articles.length ?? 0;
      const totalPages = first.totalPages ?? 1;

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            fetch(`/api/entities/regions/${regionId}?page=${i + 2}`)
              .then((r) => r.json())
              .then((d) => d.articles || [])
              .catch(() => [])
          )
        );
        articles = articles.concat(...rest);
      }

      const payload = { articles, total };
      panelCacheRef.current[countryCode] = payload;
      setPanelData({ loading: false, ...payload });
    } catch (err) {
      console.error("Error cargando artículos de la región:", err);
      setPanelData({ loading: false, articles: [], total: 0 });
    }
  };

  // Ref para que el listener de Three.js (creado una sola vez) llame siempre
  // a la versión más reciente del handler.
  const openPanelRef = useRef(openPanel);
  openPanelRef.current = openPanel;
  const handleCountryClick = (countryCode) => openPanelRef.current?.(countryCode);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const markersData = [];

    // --- ESCENA ---
    const scene = new THREE.Scene();
    // Fondo transparente para dejar ver las portadas de revistas detrás (HTML)
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3.8;

    // --- WEBGL RENDERER ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- CSS2D RENDERER ---
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(labelRenderer.domElement);

    // --- ESTRELLAS ---
    const createStars = () => {
      const geometry = new THREE.BufferGeometry();
      const count = 3000;
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const r = 80 + Math.random() * 80;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
      });

      return new THREE.Points(geometry, material);
    };
    const starField = createStars();
    scene.add(starField);

    // --- ILUMINACIÓN ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const rimLight = new THREE.SpotLight(0xbd0e0d, 5.0);
    rimLight.position.set(-5, 2, -5);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // --- GLOBO ---
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = Math.PI;
    globeGroup.rotation.x = 0.16;
    globeGroup.rotation.y = 0.5;
    scene.add(globeGroup);

    const textureLoader = new THREE.TextureLoader();
    const globeGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load("/textures/earth_atmos_2048.jpg"),
      bumpMap: textureLoader.load("/textures/earth_normal_2048.jpg"),
      bumpScale: 0.015,
      specularMap: textureLoader.load("/textures/earth_specular_2048.jpg"),
      specular: new THREE.Color("grey"),
      shininess: 15,
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // --- NUBES ---
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load("/textures/earth_clouds_1024.png"),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.805, 64, 64),
      cloudsMaterial
    );
    globeGroup.add(cloudsMesh);

    // --- ATMÓSFERA ---
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    scene.add(
      new THREE.Mesh(new THREE.SphereGeometry(1.1, 64, 64), atmosphereMaterial)
    );

    // --- CREAR TOOLTIP HTML ---
    const createTooltipDiv = (code) => {
      const name =
        countryNames[code]?.[locale] || countryNames[code]?.de || code;
      const div = document.createElement("div");
      div.style.cssText = `
        transition: all 0.3s ease;
        opacity: 0;
        transform: scale(0.8) translateY(10px);
        pointer-events: none;
      `;
      div.innerHTML = `
        <div style="
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          border-top: 2px solid #BD0E0D;
          padding: 12px 16px;
          border-radius: 0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.35);
          width: 250px;
          font-family: 'Geist', system-ui, sans-serif;
        ">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="
              background: white;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: #BD0E0D; font-weight: bold; font-size: 14px; font-family: 'Futura', Arial, sans-serif;">ila</span>
            </div>
            <span style="color: white; font-weight: bold; font-size: 16px;">${name}</span>
          </div>
          <div style="height: 1px; background: rgba(255,255,255,0.15); margin: 8px 0;"></div>
          <div style="display: flex; align-items: baseline; gap: 6px;" class="article-count">
            <span style="color: #ffffff; font-weight: bold; font-size: 22px; line-height: 1; font-variant-numeric: tabular-nums;">…</span>
            <span style="color: #9ca3af; font-size: 12px;">${locale === "de" ? "Artikel" : "artículos"}</span>
          </div>
          <div class="article-more" style="color: #BD0E0D; font-size: 11px; margin-top: 8px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
            <span style="width: 6px; height: 6px; background: #BD0E0D;"></span>
            ${locale === "de" ? "Antippen zum Erkunden" : "Tocá para explorar"}
          </div>
        </div>
      `;
      return div;
    };

    // --- MARCADORES DE PAÍSES ---
    const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);

    Object.entries(countryCoordinates).forEach(([code, coords]) => {
      const position = latLonToVector3(coords.lat, coords.lon, 0.82);
      const color = new THREE.Color(countryColors[code] || "#00ffcc");

      const point = new THREE.Mesh(
        markerGeometry,
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.3,
        })
      );
      point.position.copy(position);

      const tooltipDiv = createTooltipDiv(code);
      const cssObject = new CSS2DObject(tooltipDiv);
      cssObject.position.set(-0.15, 0.1, 0);
      point.add(cssObject);

      point.userData = {
        countryCode: code,
        targetScale: 1,
        isHovered: false,
        tooltipElement: tooltipDiv,
      };

      globeGroup.add(point);
      markersData.push(point);
    });

    // --- CONTROLES ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 6;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.8;

    // --- RAYCASTER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredCode = null;

    // --- FETCH CONTEO DE LA REGIÓN (solo el total para el tooltip de hover) ---
    const countCache = {};

    const fetchRegionPreview = async (code, tooltipElement) => {
      const regionId = countryToRegionId[code];
      if (!regionId) return;

      try {
        let total = countCache[code];
        if (total === undefined) {
          const res = await fetch(`/api/entities/regions/${regionId}?page=1`);
          const data = await res.json();
          total = data.totalArticles ?? data.articles?.length ?? 0;
          countCache[code] = total;
        }

        const countSpan = tooltipElement.querySelector(".article-count span");
        if (countSpan) countSpan.textContent = total;
      } catch (err) {
        console.error("Error fetching region count:", err);
      }
    };

    // --- EVENTOS ---
    // Raycast en una posición de pantalla: marca el país bajo el cursor/dedo
    // como "hovered" (muestra tooltip + pide el conteo). Devuelve el código.
    const updateHoverAt = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markersData, false);

      let hitCode = null;

      markersData.forEach((p) => {
        p.userData.isHovered = false;
        p.userData.targetScale = 1;
      });

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hitCode = hit.userData.countryCode;
        hit.userData.isHovered = true;
        hit.userData.targetScale = 2;
        renderer.domElement.style.cursor = "pointer";
      } else {
        renderer.domElement.style.cursor = "default";
      }

      if (currentHoveredCode !== hitCode) {
        currentHoveredCode = hitCode;

        if (hitCode) {
          const hoveredPoint = markersData.find(
            (p) => p.userData.countryCode === hitCode
          );
          if (hoveredPoint) {
            fetchRegionPreview(hitCode, hoveredPoint.userData.tooltipElement);
          }
        }
      }

      return hitCode;
    };

    const onMouseMove = (e) => updateHoverAt(e.clientX, e.clientY);

    // En desktop el hover ya marcó el país, así que el click navega directo.
    // En touch no hay hover: el primer tap revela el tooltip y el segundo entra.
    const onClick = (e) => {
      const hitCode = updateHoverAt(e.clientX, e.clientY);
      if (hitCode) {
        handleCountryClick(hitCode);
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // --- ANIMACIÓN ---
    const animate = () => {
      frameRef.current.animationId = requestAnimationFrame(animate);

      cloudsMesh.rotation.y += 0.0002;
      starField.rotation.y -= 0.0001;

      markersData.forEach((point) => {
        const { targetScale, isHovered, tooltipElement } = point.userData;

        const newScale = THREE.MathUtils.lerp(point.scale.x, targetScale, 0.1);
        point.scale.set(newScale, newScale, newScale);

        point.material.emissiveIntensity = THREE.MathUtils.lerp(
          point.material.emissiveIntensity,
          isHovered ? 0.8 : 0.3,
          0.1
        );

        if (isHovered) {
          tooltipElement.style.opacity = "1";
          tooltipElement.style.transform = "scale(1) translateY(0)";
        } else {
          tooltipElement.style.opacity = "0";
          tooltipElement.style.transform = "scale(0.8) translateY(10px)";
        }
      });

      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();
    setIsLoading(false);

    // --- RESIZE & CLEANUP ---
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      labelRenderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current.animationId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);

      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      atmosphereMaterial.dispose();
      markersData.forEach((p) => {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
      });

      labelRenderer.domElement.remove();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [locale]);

  return (
    <div className="relative w-full h-[100svh] min-h-[560px] overflow-hidden bg-black">
      {/* Fondo: grilla de portadas de dossiers difuminadas */}
      <div className="absolute inset-0 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {covers.length > 0 &&
          [...Array(40)].map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] overflow-hidden blur-[2px]"
              style={{
                transform: `rotate(${(i % 5) - 2}deg)`,
                opacity: 0.45 + ((i * 7) % 35) / 100,
              }}
            >
              <img
                src={covers[i % covers.length]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
      </div>
      {/* Velo oscuro para que el planeta resalte sobre las portadas */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Contenedor Canvas + HTML Overlay (transparente para ver el fondo) */}
      <div ref={mountRef} className="absolute inset-0 z-10">
        {isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-[#BD0E0D] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white/80 text-sm tracking-widest uppercase">
              {locale === "de" ? "Globus wird geladen" : "Cargando el globo"}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-wider uppercase bg-black/30 px-4 py-1.5 rounded-none backdrop-blur-sm border-t-2 border-[#BD0E0D] pointer-events-none">
        {locale === "de"
          ? "Ziehen • Zoom • Land antippen"
          : "Arrastrá • Zoom • Tocá un país"}
      </div>

      {/* Popup centrado con artículos clickeables (portal a document.body para
          quedar fuera del canvas/CSS2D de Three.js y poder scrollear/clickar) */}
      {mounted &&
        panel &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
            onMouseDown={(e) => {
              if (
                panelContentRef.current &&
                !panelContentRef.current.contains(e.target)
              ) {
                setPanel(null);
              }
            }}
          >
            <div
              ref={panelContentRef}
              className="w-full max-w-md max-h-[80vh] bg-[#0a0a0a] border-t-2 border-[#BD0E0D] shadow-2xl flex flex-col"
            >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-[#BD0E0D] font-futura font-bold text-sm">
                  ila
                </span>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base truncate">
                    {panel.name}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {panelData.total}{" "}
                    {locale === "de" ? "Artikel" : "artículos"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="shrink-0 text-white/60 hover:text-white transition-colors"
                aria-label={locale === "de" ? "Schließen" : "Cerrar"}
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
            </div>

            {/* Lista */}
            <style>{`
              .globe-articles-scroll::-webkit-scrollbar { width: 8px; }
              .globe-articles-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); }
              .globe-articles-scroll::-webkit-scrollbar-thumb { background: #BD0E0D; }
              .globe-articles-scroll { scrollbar-width: thin; scrollbar-color: #BD0E0D rgba(255,255,255,0.06); }
            `}</style>
            <div className="globe-articles-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {panelData.loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-[#BD0E0D] rounded-full animate-spin" />
                  {locale === "de" ? "Lädt…" : "Cargando…"}
                </div>
              ) : panelData.articles.length === 0 ? (
                <p className="px-5 py-10 text-center text-gray-500 text-sm">
                  {locale === "de"
                    ? "Keine Artikel gefunden."
                    : "No hay artículos."}
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {panelData.articles.map((a) => {
                    const title =
                      locale === "es" && a.isTranslatedES && a.titleES
                        ? a.titleES
                        : a.title;
                    const href = a.legacyPath
                      ? `/${locale}${a.legacyPath}`
                      : `/${locale}/articles/${a.id}`;
                    const img = a.images?.[0]?.url;
                    const author = a.authors?.[0]?.name;
                    const topics = (a.topics || []).slice(0, 2);
                    const isBookReview =
                      a.beitragstyp?.name === "Buchbesprechung";
                    const typeLabel = a.beitragstyp
                      ? locale === "es" && a.beitragstyp.nameES
                        ? a.beitragstyp.nameES
                        : a.beitragstyp.name
                      : null;
                    const year = a.publicationDate
                      ? new Date(a.publicationDate).getFullYear()
                      : null;
                    return (
                      <li key={a.id}>
                        <Link
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          {img && (
                            <img
                              src={img}
                              alt=""
                              loading="lazy"
                              className="h-16 w-16 shrink-0 object-cover bg-white/5"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {typeLabel && (
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wide ${
                                    isBookReview
                                      ? "text-amber-400"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {isBookReview ? "📖 " : ""}
                                  {typeLabel}
                                </span>
                              )}
                              {topics.map((tp) => (
                                <span
                                  key={tp.id}
                                  className="text-[10px] font-bold uppercase tracking-wide text-[#BD0E0D]"
                                >
                                  {tp.name}
                                </span>
                              ))}
                            </div>
                            <span className="block text-sm font-semibold leading-snug text-gray-100 line-clamp-2 group-hover:text-white">
                              {title}
                            </span>
                            {a.subtitle && (
                              <span className="mt-0.5 block text-xs leading-snug text-gray-400 line-clamp-2">
                                {a.subtitle}
                              </span>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                              {author && (
                                <span className="truncate">{author}</span>
                              )}
                              {a.edition?.number && (
                                <span className="shrink-0 tabular-nums">
                                  № {a.edition.number}
                                  {year ? ` · ${year}` : ""}
                                </span>
                              )}
                              {!a.edition?.number && year && (
                                <span className="shrink-0 tabular-nums">
                                  {year}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer: ver todos */}
            {panelData.total > 0 && (
              <Link
                href={`/${locale}/entities/regions/${panel.regionId}`}
                className="block border-t border-white/10 px-5 py-3 text-center text-sm font-bold text-[#BD0E0D] hover:bg-white/5 transition-colors"
              >
                {locale === "de"
                  ? `Alle ${panelData.total} ansehen →`
                  : `Ver todos (${panelData.total}) →`}
              </Link>
            )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
