"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import QueuePlayer from "../ArticleListen/QueuePlayer";
import { useCanListenGlobila } from "../ArticleListen/useCanListenGlobila";

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

  // Intro dramática: barra de tensión → el globo nace minúsculo y crece.
  // "progress" = barra avanzando · "growing" = el globo crece · "done"
  const [introPhase, setIntroPhase] = useState("progress");
  const [progress, setProgress] = useState(0);
  const growRef = useRef({ active: false, t: 0 });
  // El wordmark nace en el centro del planeta y, al primer gesto del usuario
  // (arrastrar o zoom), se reubica en la esquina superior izquierda.
  const [interacted, setInteracted] = useState(false);

  // Driver de la barra de progreso (timed, para dar suspenso antes del globo)
  useEffect(() => {
    let raf;
    const duration = 2200;
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const tick = () => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const p = Math.min(100, ((now - start) / duration) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Beat de tensión antes de que el planeta empiece a crecer
        setTimeout(() => {
          growRef.current.active = true;
          setIntroPhase("growing");
        }, 280);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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

  // --- MODO TEMA: un tema "enciende" los países donde tiene cobertura ---
  // El globo es geográfico; al elegir un tema, en vez de listar por región,
  // iluminamos los países (dimensionados por nº de artículos del tema) y el
  // click filtra por tema + país.
  // Exploración combinada: tema · tipo de artículo · autor (AND). Las tres
  // dimensiones se acumulan y alimentan el mismo "heatmap" del globo.
  const [topicList, setTopicList] = useState([]);
  const [typeList, setTypeList] = useState([]);
  const [authorList, setAuthorList] = useState([]);
  const [filterKind, setFilterKind] = useState("topic"); // pestaña visible del picker
  // Selección independiente por dimensión — { id, name, nameES } o null
  const [selTopic, setSelTopic] = useState(null);
  const [selType, setSelType] = useState(null);
  const [selAuthor, setSelAuthor] = useState(null);
  const [filterInfo, setFilterInfo] = useState(null); // { loading, countriesLit, total }
  const [filterSearch, setFilterSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeFilters = [
    selTopic ? { kind: "topic", ...selTopic } : null,
    selType ? { kind: "beitragstyp", ...selType } : null,
    selAuthor ? { kind: "author", ...selAuthor } : null,
  ].filter(Boolean);
  const hasAnyFilter = activeFilters.length > 0;

  // Query string común para los endpoints /explore (topicId/typeId/authorId)
  const buildFilterQuery = () => {
    const p = new URLSearchParams();
    if (selTopic) p.set("topicId", selTopic.id);
    if (selType) p.set("typeId", selType.id);
    if (selAuthor) p.set("authorId", selAuthor.id);
    return p;
  };

  // Puente hacia el closure de Three.js (counts por regionId, creado una vez).
  // Se mantiene el nombre topicModeRef para no tocar el render del globo.
  const topicModeRef = useRef({
    active: false,
    counts: new Map(),
    max: 0,
    sig: "",
  });

  // Listas de tema y tipo: se cargan una vez (son acotadas)
  useEffect(() => {
    fetch("/api/entities/topics")
      .then((r) => r.json())
      .then((data) => setTopicList(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error cargando temas:", err));
    fetch("/api/entities/beitragstypen")
      .then((r) => r.json())
      .then((data) => setTypeList(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error cargando tipos:", err));
  }, []);

  // Lista de autores: hay muchos, se busca en el servidor (?q=)
  useEffect(() => {
    if (filterKind !== "author") return;
    const q = filterSearch.trim();
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/entities/authors${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data) => setAuthorList(Array.isArray(data) ? data : []))
        .catch((err) => {
          if (err.name !== "AbortError")
            console.error("Error cargando autores:", err);
        });
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [filterKind, filterSearch]);

  useEffect(() => {
    const sig = `${selTopic?.id || ""}|${selType?.id || ""}|${selAuthor?.id || ""}`;
    if (!hasAnyFilter) {
      topicModeRef.current = { active: false, counts: new Map(), max: 0, sig: "" };
      setFilterInfo(null);
      return;
    }
    let cancelled = false;
    setFilterInfo({ loading: true });
    // Cambiar de filtro invalida el cache del panel y cierra el panel abierto
    panelCacheRef.current = {};
    setPanel(null);

    fetch(`/api/entities/explore/regions?${buildFilterQuery().toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const counts = new Map();
        for (const r of data.regions || []) counts.set(r.id, r.count);
        // max sobre los países que de verdad están en el globo (para escalar
        // la intensidad sin que regiones-continente lo distorsionen)
        const globeRegionIds = new Set(Object.values(countryToRegionId));
        let max = 0;
        for (const [rid, c] of counts) {
          if (globeRegionIds.has(rid) && c > max) max = c;
        }
        const litCountries = Object.keys(countryToRegionId).filter((code) =>
          counts.has(countryToRegionId[code])
        ).length;
        topicModeRef.current = { active: true, counts, max, sig };
        setFilterInfo({
          loading: false,
          countriesLit: litCountries,
          total: data.total ?? 0,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error cargando regiones del filtro:", err);
        topicModeRef.current = { active: true, counts: new Map(), max: 0, sig };
        setFilterInfo({ loading: false, countriesLit: 0, total: 0 });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selTopic, selType, selAuthor]);

  // --- EXPEDICIÓN: el suscriptor "pica" artículos que vuelan a la pila
  // (esquina sup. derecha) y al cerrar los guarda como lista de lectura ---
  const [collected, setCollected] = useState([]);
  const [finishOpen, setFinishOpen] = useState(false);
  const [expeditionName, setExpeditionName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // null | "ok" | "auth" | "error"
  const pileRef = useRef(null);

  // Escucha (TTS) dentro de GLOBila — gateada por el flag `globila`.
  const canListen = useCanListenGlobila();
  const [listenId, setListenId] = useState(null);
  const collectedIds = useMemo(
    () => new Set(collected.map((a) => a.id)),
    [collected]
  );

  // Persistencia en sessionStorage: sobrevive recargas dentro de la sesión
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("globila_collected");
      if (raw) setCollected(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("globila_collected", JSON.stringify(collected));
    } catch {
      /* ignore */
    }
  }, [collected]);

  // Clon que vuela de la miniatura a la pila (Web Animations API, imperativo)
  const flyToPile = (imgUrl, fromRect) => {
    const pile = pileRef.current;
    if (!pile || !fromRect || typeof document === "undefined") return;
    const to = pile.getBoundingClientRect();
    const clone = document.createElement("div");
    clone.style.cssText = `position:fixed;left:${fromRect.left}px;top:${fromRect.top}px;width:${fromRect.width}px;height:${fromRect.height}px;z-index:10000;pointer-events:none;border:2px solid #89B881;background:#000 center/cover no-repeat;box-shadow:0 8px 24px rgba(0,0,0,.5);border-radius:0;`;
    if (imgUrl) clone.style.backgroundImage = `url("${imgUrl}")`;
    document.body.appendChild(clone);
    const dx = to.left + to.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = to.top + to.height / 2 - (fromRect.top + fromRect.height / 2);
    const anim = clone.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        {
          transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 50}px) scale(0.6)`,
          opacity: 0.95,
          offset: 0.6,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(0.12)`,
          opacity: 0.15,
        },
      ],
      { duration: 700, easing: "cubic-bezier(0.5, -0.3, 0.3, 1)" }
    );
    anim.onfinish = () => {
      clone.remove();
      pile.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.18)" },
          { transform: "scale(1)" },
        ],
        { duration: 300, easing: "ease-out" }
      );
    };
  };

  // slim = { id, title, titleES, isTranslatedES, legacyPath, image, author, editionNumber }
  const toggleCollect = (slim, ev) => {
    if (collectedIds.has(slim.id)) {
      setCollected((prev) => prev.filter((x) => x.id !== slim.id));
      return;
    }
    let fromRect = null;
    const li = ev?.currentTarget?.closest("li");
    const img = li?.querySelector("img");
    const srcEl = img || ev?.currentTarget;
    if (srcEl) fromRect = srcEl.getBoundingClientRect();
    const imgUrl = img?.getAttribute("src") || slim.image || null;
    flyToPile(imgUrl, fromRect);
    setCollected((prev) => [...prev, slim]);
  };

  const openFinish = () => {
    if (!collected.length) return;
    const d = new Date().toLocaleDateString(locale === "de" ? "de-DE" : "es-ES");
    const base = hasAnyFilter
      ? activeFilters
          .map((f) => (locale === "es" && f.nameES ? f.nameES : f.name))
          .join(" · ")
      : "GLOBila";
    setExpeditionName(`${base} · ${d}`);
    setSaveResult(null);
    setFinishOpen(true);
  };

  const saveExpedition = async () => {
    if (!collected.length || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/globila/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: expeditionName,
          articleIds: collected.map((a) => a.id),
        }),
      });
      if (res.status === 401) {
        setSaveResult("auth");
        return;
      }
      if (!res.ok) {
        setSaveResult("error");
        return;
      }
      setSaveResult("ok");
      setCollected([]);
      try {
        sessionStorage.removeItem("globila_collected");
      } catch {
        /* ignore */
      }
    } catch {
      setSaveResult("error");
    } finally {
      setSaving(false);
    }
  };

  const openPanel = async (countryCode) => {
    const regionId = countryToRegionId[countryCode];
    if (!regionId) return;

    const flt = topicModeRef.current.active ? topicModeRef.current : null;
    // Con filtro activo, los países "apagados" (sin artículos) no abren nada
    if (flt && !flt.counts.has(regionId)) return;

    const name =
      countryNames[countryCode]?.[locale] ||
      countryNames[countryCode]?.de ||
      countryCode;
    setPanel({
      code: countryCode,
      name,
      regionId,
      filtered: !!flt,
    });

    const cacheKey = `${flt ? flt.sig : "region"}:${countryCode}`;
    const cached = panelCacheRef.current[cacheKey];
    if (cached) {
      setPanelData({ loading: false, ...cached });
      return;
    }

    setPanelData({ loading: true, articles: [], total: 0 });
    try {
      const base = flt
        ? `/api/entities/explore?${buildFilterQuery().toString()}&regionId=${regionId}`
        : `/api/entities/regions/${regionId}`;
      const sep = base.includes("?") ? "&" : "?";

      const first = await fetch(`${base}${sep}page=1`).then((r) => r.json());
      let articles = first.articles || [];
      const total = first.totalArticles ?? articles.length ?? 0;
      const totalPages = first.totalPages ?? 1;

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            fetch(`${base}${sep}page=${i + 2}`)
              .then((r) => r.json())
              .then((d) => d.articles || [])
              .catch(() => [])
          )
        );
        articles = articles.concat(...rest);
      }

      const payload = { articles, total };
      panelCacheRef.current[cacheKey] = payload;
      setPanelData({ loading: false, ...payload });
    } catch (err) {
      console.error("Error cargando artículos:", err);
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
    // Nace prácticamente invisible; la animación de intro lo hace crecer
    globeGroup.scale.setScalar(growRef.current.active ? 1 : 0.0001);
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
    // Dentro del grupo para que el halo crezca junto con el globo en la intro
    globeGroup.add(
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
          border-top: 2px solid #89B881;
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
              <span style="color: #557a4c; font-weight: bold; font-size: 14px; font-family: 'Futura', Arial, sans-serif;">ila</span>
            </div>
            <span style="color: white; font-weight: bold; font-size: 16px;">${name}</span>
          </div>
          <div style="height: 1px; background: rgba(255,255,255,0.15); margin: 8px 0;"></div>
          <div style="display: flex; align-items: baseline; gap: 6px;" class="article-count">
            <span style="color: #ffffff; font-weight: bold; font-size: 22px; line-height: 1; font-variant-numeric: tabular-nums;">…</span>
            <span style="color: #9ca3af; font-size: 12px;">${locale === "de" ? "Artikel" : "artículos"}</span>
          </div>
          <div class="article-more" style="color: #89B881; font-size: 11px; margin-top: 8px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
            <span style="width: 6px; height: 6px; background: #89B881;"></span>
            ${locale === "de" ? "Antippen zum Erkunden" : "Tocá para explorar"}
          </div>
        </div>
      `;
      return div;
    };

    // --- MARCADORES DE PAÍSES ---
    // Esfera invisible = blanco del raycast · círculo "ila" (CSS2D) = visual
    const markerGeometry = new THREE.SphereGeometry(0.03, 12, 12);

    // Texto legible (negro/blanco) según la luminancia del color de fondo
    const readableText = (hex) => {
      const c = hex.replace("#", "");
      const r = parseInt(c.slice(0, 2), 16);
      const g = parseInt(c.slice(2, 4), 16);
      const b = parseInt(c.slice(4, 6), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.6 ? "#111111" : "#ffffff";
    };

    const createMarkerDiv = (colorHex) => {
      const div = document.createElement("div");
      div.style.cssText = `
        position: relative;
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background: ${colorHex};
        color: ${readableText(colorHex)};
        box-shadow: 0 0 0 1.5px #ffffff, 0 1px 4px rgba(0,0,0,0.5);
        transition: opacity 0.4s ease, box-shadow 0.25s ease;
        pointer-events: none;
        opacity: 0;
        will-change: opacity;
      `;
      const label = document.createElement("span");
      label.textContent = "ila";
      // Centrado absoluto: no depende del flex ni del transform que el
      // CSS2DRenderer reescribe en el div externo cada frame.
      label.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, calc(-50% + 0.5px));
        font-family: 'Futura Cyrillic', Arial, sans-serif;
        font-weight: 800;
        font-size: 11px;
        line-height: 1;
        letter-spacing: -0.3px;
        white-space: nowrap;
      `;
      div.appendChild(label);
      return div;
    };

    Object.entries(countryCoordinates).forEach(([code, coords]) => {
      const position = latLonToVector3(coords.lat, coords.lon, 0.82);
      const colorHex = countryColors[code] || "#00ffcc";

      const point = new THREE.Mesh(
        markerGeometry,
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      point.position.copy(position);

      const markerDiv = createMarkerDiv(colorHex);
      point.add(new CSS2DObject(markerDiv));

      const tooltipDiv = createTooltipDiv(code);
      const tooltipObject = new CSS2DObject(tooltipDiv);
      tooltipObject.position.set(-0.15, 0.18, 0);
      point.add(tooltipObject);

      point.userData = {
        countryCode: code,
        isHovered: false,
        tooltipElement: tooltipDiv,
        tooltipObject,
        markerElement: markerDiv,
        colorHex,
      };

      globeGroup.add(point);
      markersData.push(point);
    });

    // --- RELLENOS DE PAÍSES (silueta proyectada sobre la esfera, en hover) ---
    const countryFills = {}; // code -> { material }
    let fillsDisposed = false;
    const FILL_RADIUS = 0.803; // apenas por encima de la superficie (0.8)

    // Triángulo lon/lat → se subdivide hasta abrazar la curvatura y se proyecta
    const pushTriangle = (arr, a, b, c) => {
      const maxEdge = Math.max(
        a.distanceTo(b),
        b.distanceTo(c),
        c.distanceTo(a)
      );
      if (maxEdge > 4) {
        const ab = new THREE.Vector2((a.x + b.x) / 2, (a.y + b.y) / 2);
        const bc = new THREE.Vector2((b.x + c.x) / 2, (b.y + c.y) / 2);
        const ca = new THREE.Vector2((c.x + a.x) / 2, (c.y + a.y) / 2);
        pushTriangle(arr, a, ab, ca);
        pushTriangle(arr, ab, b, bc);
        pushTriangle(arr, ca, bc, c);
        pushTriangle(arr, ab, bc, ca);
        return;
      }
      for (const p of [a, b, c]) {
        const v = latLonToVector3(p.y, p.x, FILL_RADIUS); // p = (lon, lat)
        arr.push(v.x, v.y, v.z);
      }
    };

    const buildCountryFills = (borders) => {
      if (fillsDisposed) return;
      Object.entries(borders).forEach(([code, rings]) => {
        const colorHex = countryColors[code] || "#00ffcc";
        const positions = [];
        rings.forEach((ring) => {
          const contour = ring.map(([lon, lat]) => new THREE.Vector2(lon, lat));
          const first = contour[0];
          const last = contour[contour.length - 1];
          if (first && last && first.x === last.x && first.y === last.y) {
            contour.pop();
          }
          if (contour.length < 3) return;
          const faces = THREE.ShapeUtils.triangulateShape(contour, []);
          faces.forEach(([i0, i1, i2]) => {
            pushTriangle(positions, contour[i0], contour[i1], contour[i2]);
          });
        });
        if (!positions.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3)
        );
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 1;
        globeGroup.add(mesh);
        countryFills[code] = { mesh, material: mat };
      });
    };

    fetch("/data/country-borders.json")
      .then((r) => r.json())
      .then(buildCountryFills)
      .catch((err) => console.error("Error cargando fronteras:", err));

    // --- CONTROLES ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 6;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.8;

    // Primer gesto deliberado (arrastrar o zoom) → reubica el wordmark
    const markInteracted = () => setInteracted(true);
    controls.addEventListener("start", markInteracted);
    renderer.domElement.addEventListener("wheel", markInteracted, {
      passive: true,
    });

    // --- RAYCASTER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredCode = null;

    // --- FETCH CONTEO DE LA REGIÓN (solo el total para el tooltip de hover) ---
    const countCache = {};

    const fetchRegionPreview = async (code, tooltipElement) => {
      const regionId = countryToRegionId[code];
      if (!regionId) return;

      // En modo tema el conteo ya lo tenemos en memoria (artículos del tema en
      // ese país), no hay que pedirlo: se lee del mapa cacheado.
      const topic = topicModeRef.current;
      if (topic.active) {
        const total = topic.counts.get(regionId) ?? 0;
        const countSpan = tooltipElement.querySelector(".article-count span");
        if (countSpan) countSpan.textContent = total;
        return;
      }

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
      });

      // Rechazar impactos sobre marcadores del hemisferio trasero (detrás del
      // globo): un HTML CSS2D no se ocluye solo, así que lo filtramos a mano.
      const camDir = camera.position.clone().normalize();
      let hit = intersects.find((it) => {
        const n = it.object.getWorldPosition(new THREE.Vector3()).normalize();
        return n.dot(camDir) > 0.12;
      })?.object;

      // En modo tema, los países "apagados" no responden al hover ni al click
      const topic = topicModeRef.current;
      if (hit && topic.active) {
        const rid = countryToRegionId[hit.userData.countryCode];
        if (!topic.counts.has(rid)) hit = undefined;
      }

      if (hit) {
        hitCode = hit.userData.countryCode;
        hit.userData.isHovered = true;
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
    const _markerWorldPos = new THREE.Vector3();
    // easeOutBack: crece con un leve rebote al llegar al tamaño final
    const easeOutBack = (x) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const animate = () => {
      frameRef.current.animationId = requestAnimationFrame(animate);

      // Crecimiento del globo desde minúsculo hasta tamaño completo
      if (growRef.current.active && growRef.current.t < 1) {
        growRef.current.t = Math.min(1, growRef.current.t + 0.011);
        const s = 0.0001 + (1 - 0.0001) * easeOutBack(growRef.current.t);
        globeGroup.scale.setScalar(s);
        // Al terminar de crecer, recién ahí revelamos el wordmark
        if (growRef.current.t >= 1 && !growRef.current.done) {
          growRef.current.done = true;
          setIntroPhase("done");
        }
      }

      cloudsMesh.rotation.y += 0.0002;
      starField.rotation.y -= 0.0001;

      const camDir = camera.position.clone().normalize();
      const topic = topicModeRef.current;
      markersData.forEach((point) => {
        const {
          isHovered,
          tooltipElement,
          tooltipObject,
          markerElement,
          colorHex,
          countryCode,
        } = point.userData;

        // El tooltip activo se pone delante de todos los círculos (el
        // CSS2DRenderer ordena el z-index por renderOrder y luego distancia)
        tooltipObject.renderOrder = isHovered ? 1000 : 0;

        // Hasta que el globo no terminó de crecer, marcadores ocultos
        if (!growRef.current.done) {
          markerElement.style.opacity = "0";
          tooltipElement.style.opacity = "0";
          return;
        }

        // Oclusión: visible solo si el marcador mira hacia la cámara
        const normal = point
          .getWorldPosition(_markerWorldPos)
          .normalize();
        const onFront = normal.dot(camDir) > 0.12;

        // Modo tema: encendido/apagado de países según cobertura del tema
        let lit = true;
        let intensity = 1; // 0..1 según volumen del tema en ese país
        if (topic.active) {
          const rid = countryToRegionId[countryCode];
          const c = topic.counts.get(rid);
          lit = c !== undefined && c > 0;
          intensity = lit && topic.max > 0 ? c / topic.max : 0;
        }

        if (!onFront) {
          markerElement.style.opacity = "0";
        } else if (topic.active && !lit) {
          markerElement.style.opacity = "0.14"; // apagado pero presente
        } else {
          markerElement.style.opacity = "1";
        }

        const glowSize = topic.active && lit ? 6 + intensity * 14 : 16;
        markerElement.style.boxShadow =
          isHovered || (topic.active && lit)
            ? `0 0 0 ${isHovered ? 2 : 1.5}px #ffffff, 0 0 ${glowSize}px ${
                isHovered ? 4 : 3
              }px ${colorHex}`
            : `0 0 0 1.5px #ffffff, 0 1px 4px rgba(0,0,0,0.5)`;

        if (isHovered && onFront) {
          tooltipElement.style.opacity = "1";
          tooltipElement.style.transform = "scale(1) translateY(0)";
        } else {
          tooltipElement.style.opacity = "0";
          tooltipElement.style.transform = "scale(0.8) translateY(10px)";
        }
      });

      // Rellenos de países: en modo tema los encendidos quedan teñidos según
      // volumen; el del cursor se intensifica. Fuera de modo tema, solo hover.
      for (const code in countryFills) {
        let target = code === currentHoveredCode ? 0.45 : 0;
        if (topic.active) {
          const rid = countryToRegionId[code];
          const c = topic.counts.get(rid);
          if (c !== undefined && c > 0) {
            const intensity = topic.max > 0 ? c / topic.max : 0;
            const base = 0.16 + intensity * 0.34;
            target = code === currentHoveredCode ? Math.min(0.6, base + 0.2) : base;
          } else {
            target = 0;
          }
        }
        const mat = countryFills[code].material;
        mat.opacity += (target - mat.opacity) * 0.15;
      }

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
      renderer.domElement.removeEventListener("wheel", markInteracted);
      controls.removeEventListener("start", markInteracted);

      fillsDisposed = true;
      Object.values(countryFills).forEach(({ mesh, material }) => {
        globeGroup.remove(mesh);
        mesh.geometry.dispose();
        material.dispose();
      });

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

  // Lista de la dimensión activa (tema / tipo / autor).
  const activeList =
    filterKind === "beitragstyp"
      ? typeList
      : filterKind === "author"
        ? authorList
        : topicList;

  const filteredOptions = (() => {
    // Autor: el servidor ya filtró por ?q=, mostramos tal cual.
    if (filterKind === "author") return authorList;
    const q = filterSearch.trim().toLowerCase();
    const list = q
      ? activeList.filter(
          (t) =>
            (t.name || "").toLowerCase().includes(q) ||
            (t.nameES || "").toLowerCase().includes(q)
        )
      : activeList;
    // Con búsqueda mostramos todo lo que matchee; sin búsqueda un tope alto
    // para no renderizar cientos de golpe (la lista está ordenada por nº de artículos).
    return q ? list : list.slice(0, 300);
  })();

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

      {/* Wordmark GLOBila — nace en el centro del planeta (fade lento) y migra
          a la esquina superior izquierda al primer gesto del usuario */}
      <div
        className={`absolute z-20 pointer-events-none select-none transition-all duration-[1400ms] ease-in-out ${
          introPhase !== "done"
            ? "opacity-0 blur-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : interacted
              ? "opacity-100 blur-0 top-[90px] md:top-6 left-4 md:left-6 translate-x-0 translate-y-0"
              : "opacity-100 blur-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        }`}
      >
        <span
          className={`font-futura font-extrabold tracking-tight leading-none transition-all duration-[1400ms] ease-in-out ${
            interacted ? "text-3xl md:text-4xl" : "text-5xl md:text-7xl"
          }`}
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
        >
          <span className="text-white">GLOB</span>
          <span className="text-[#89B881]">ila</span>
        </span>
      </div>

      {/* Contenedor Canvas + HTML Overlay (transparente para ver el fondo) */}
      <div ref={mountRef} className="absolute inset-0 z-10" />

      {/* Intro: barra de tensión antes de que nazca el planeta */}
      {introPhase === "progress" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 px-8 pointer-events-none select-none">
          <div className="text-white/70 text-xs md:text-sm tracking-[0.3em] uppercase animate-pulse">
            {locale === "de"
              ? "Unsere Erde erwacht"
              : "Nuestra Tierra despierta"}
          </div>
          <div className="relative h-[3px] w-64 max-w-[70vw] overflow-hidden bg-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-[#89B881] shadow-[0_0_12px_2px_rgba(137,184,129,0.7)] transition-[width] duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className="font-mono text-2xl md:text-3xl font-extrabold tabular-nums text-white"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            {Math.round(progress)}
            <span className="text-[#89B881]">%</span>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-wider uppercase bg-black/30 px-4 py-1.5 rounded-none backdrop-blur-sm border-t-2 border-[#89B881] pointer-events-none">
        {locale === "de"
          ? "Ziehen • Zoom • Land antippen"
          : "Arrastrá • Zoom • Tocá un país"}
      </div>

      {/* Selector de exploración — enciende el globo por tema, tipo o autor */}
      <div className="absolute z-30 top-[84px] md:top-5 left-1/2 -translate-x-1/2 w-[min(92vw,460px)] flex flex-col items-center gap-2">
        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="flex-1 flex items-center justify-between gap-2 bg-black/55 backdrop-blur-sm border-t-2 border-[#89B881] px-4 py-2.5 text-left hover:bg-black/70 transition-colors"
          >
            <span className="min-w-0 truncate text-sm font-bold text-white">
              {hasAnyFilter
                ? activeFilters
                    .map((f) => (locale === "es" && f.nameES ? f.nameES : f.name))
                    .join(" · ")
                : locale === "de"
                  ? "Erkunden nach…"
                  : "Explorar por…"}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-[#89B881] transition-transform ${
                pickerOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={() => {
                setSelTopic(null);
                setSelType(null);
                setSelAuthor(null);
                setPickerOpen(false);
              }}
              className="shrink-0 bg-black/55 backdrop-blur-sm border-t-2 border-white/30 px-3 py-2.5 text-white/70 hover:text-white transition-colors"
              aria-label={
                locale === "de" ? "Filter entfernen" : "Quitar filtros"
              }
            >
              <svg
                className="w-4 h-4"
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
          )}
        </div>

        {/* Chips de filtros activos (removibles uno a uno) */}
        {hasAnyFilter && (
          <div className="w-full flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <span
                key={f.kind}
                className="inline-flex items-center gap-1 bg-[#557a4c] px-2 py-1 text-[11px] font-bold text-white"
              >
                {locale === "es" && f.nameES ? f.nameES : f.name}
                <button
                  type="button"
                  onClick={() => {
                    if (f.kind === "topic") setSelTopic(null);
                    else if (f.kind === "beitragstyp") setSelType(null);
                    else setSelAuthor(null);
                  }}
                  className="text-white/70 hover:text-white"
                  aria-label={locale === "de" ? "Entfernen" : "Quitar"}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Leyenda combinada de los filtros activos */}
        {hasAnyFilter && filterInfo && !filterInfo.loading && (
          <div className="w-full bg-black/45 backdrop-blur-sm px-3 py-1.5 text-[11px] text-gray-300 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#89B881] shadow-[0_0_8px_2px_rgba(137,184,129,0.8)]" />
            {filterInfo.total === 0
              ? locale === "de"
                ? "Keine Treffer — Filter lockern"
                : "Sin resultados — quitá algún filtro"
              : locale === "de"
                ? `${filterInfo.countriesLit} Länder · ${filterInfo.total} Artikel`
                : `${filterInfo.countriesLit} países · ${filterInfo.total} artículos`}
          </div>
        )}

        {/* Dropdown: pestañas de dimensión + buscador + chips */}
        {pickerOpen && (
          <div className="w-full bg-[#0a0a0a]/95 backdrop-blur-sm border border-white/10 max-h-[56vh] flex flex-col">
            {/* Pestañas: Tema / Tipo / Autor */}
            <div className="flex border-b border-white/10">
              {[
                { kind: "topic", de: "Thema", es: "Tema" },
                { kind: "beitragstyp", de: "Typ", es: "Tipo" },
                { kind: "author", de: "Autor:in", es: "Autor" },
              ].map((tab) => (
                <button
                  key={tab.kind}
                  type="button"
                  onClick={() => {
                    setFilterKind(tab.kind);
                    setFilterSearch("");
                  }}
                  className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${
                    filterKind === tab.kind
                      ? "bg-[#557a4c] text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {locale === "de" ? tab.de : tab.es}
                </button>
              ))}
            </div>
            <div className="p-2 border-b border-white/10">
              <input
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder={
                  filterKind === "author"
                    ? locale === "de"
                      ? "Autor:in suchen…"
                      : "Buscar autor…"
                    : filterKind === "beitragstyp"
                      ? locale === "de"
                        ? "Typ suchen…"
                        : "Buscar tipo…"
                      : locale === "de"
                        ? "Thema suchen…"
                        : "Buscar tema…"
                }
                className="w-full bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:bg-white/10"
              />
            </div>
            <div className="globe-articles-scroll overflow-y-auto p-2 flex flex-wrap gap-1.5 content-start">
              {filteredOptions.length === 0 ? (
                <p className="px-2 py-3 text-xs text-gray-500">
                  {locale === "de"
                    ? "Nichts gefunden."
                    : "Sin resultados."}
                </p>
              ) : (
                filteredOptions.map((t) => {
                  const label =
                    locale === "es" && t.nameES ? t.nameES : t.name;
                  const active =
                    (filterKind === "topic" && selTopic?.id === t.id) ||
                    (filterKind === "beitragstyp" && selType?.id === t.id) ||
                    (filterKind === "author" && selAuthor?.id === t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const val = active
                          ? null
                          : { id: t.id, name: t.name, nameES: t.nameES };
                        if (filterKind === "topic") setSelTopic(val);
                        else if (filterKind === "beitragstyp") setSelType(val);
                        else setSelAuthor(val);
                        setFilterSearch("");
                      }}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#557a4c] text-white"
                          : "bg-white/[0.08] text-gray-200 hover:bg-white/15"
                      }`}
                    >
                      {label}{" "}
                      <span className="opacity-60 tabular-nums">{t.count}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pila de la expedición — cards apiladas, esquina superior derecha */}
      {collected.length > 0 && (
        <div className="absolute z-40 top-[84px] md:top-5 right-3 md:right-5 flex w-[300px] max-w-[85vw] flex-col items-stretch gap-2">
          {/* Encabezado */}
          <div className="flex items-center justify-between border border-[#89B881]/40 bg-black/70 px-3 py-2 backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-wide text-[#89B881]">
              {locale === "de" ? "Expedition" : "Expedición"}
            </span>
            <span className="flex h-5 min-w-[20px] items-center justify-center bg-[#557a4c] px-1 text-[11px] font-bold text-white tabular-nums">
              {collected.length}
            </span>
          </div>

          {/* Cards apiladas (misma estética del panel de país) */}
          <div
            ref={pileRef}
            className="flex max-h-[52vh] flex-col gap-1.5 overflow-y-auto pr-0.5"
          >
            {collected.map((a) => {
              const title =
                locale === "es" && a.isTranslatedES && a.titleES
                  ? a.titleES
                  : a.title;
              return (
                <div
                  key={a.id}
                  className="relative border border-white/10 bg-black/70 backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCollected((prev) =>
                        prev.filter((x) => x.id !== a.id)
                      )
                    }
                    aria-label={locale === "de" ? "Entfernen" : "Quitar"}
                    title={locale === "de" ? "Entfernen" : "Quitar"}
                    className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center border border-white/25 bg-black/60 text-white/70 transition-colors hover:border-red-400 hover:text-red-300"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <div className="flex gap-2.5 p-2 pr-8">
                    {a.image && (
                      <img
                        src={a.image}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 bg-white/5 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {a.typeLabel && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide ${
                              a.isBookReview ? "text-amber-400" : "text-gray-400"
                            }`}
                          >
                            {a.isBookReview ? "📖 " : ""}
                            {a.typeLabel}
                          </span>
                        )}
                        {(a.topics || []).map((tp) => (
                          <span
                            key={tp.id}
                            className="text-[9px] font-bold uppercase tracking-wide text-[#89B881]"
                          >
                            {tp.name}
                          </span>
                        ))}
                      </div>
                      <span className="block text-[13px] font-semibold leading-snug text-gray-100 line-clamp-2">
                        {title}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-500">
                        {a.author && (
                          <span className="truncate">{a.author}</span>
                        )}
                        {a.editionNumber && (
                          <span className="shrink-0 tabular-nums">
                            № {a.editionNumber}
                            {a.year ? ` · ${a.year}` : ""}
                          </span>
                        )}
                        {!a.editionNumber && a.year && (
                          <span className="shrink-0 tabular-nums">{a.year}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openFinish}
            className="bg-[#557a4c] px-3 py-2 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#46663f]"
          >
            {locale === "de"
              ? `Expedition beenden (${collected.length})`
              : `Finalizar expedición (${collected.length})`}
          </button>
        </div>
      )}

      {/* Reproductor TTS de un artículo desde el panel */}
      {listenId && (
        <QueuePlayer
          ids={[listenId]}
          initialLang={locale}
          onClose={() => setListenId(null)}
        />
      )}

      {/* Modal de cierre: nombrar y guardar la expedición */}
      {mounted &&
        finishOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !saving) setFinishOpen(false);
            }}
          >
            <div className="w-full max-w-lg max-h-[85vh] bg-[#0a0a0a] border-t-2 border-[#89B881] shadow-2xl flex flex-col">
              {saveResult === "ok" ? (
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#557a4c] text-white">
                    <svg
                      className="h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {locale === "de"
                      ? "Expedition gespeichert"
                      : "Expedición guardada"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {locale === "de"
                      ? "Du findest sie in deinem Dashboard."
                      : "La encontrás en tu panel."}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href={`/${locale}/dashboard-users`}
                      className="bg-[#557a4c] hover:bg-[#46663f] px-4 py-2 text-sm font-bold text-white transition-colors"
                    >
                      {locale === "de" ? "Zu Mein ila" : "A Mi ila"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setFinishOpen(false)}
                      className="px-4 py-2 text-sm font-bold text-white/70 hover:text-white transition-colors"
                    >
                      {locale === "de"
                        ? "Weiter erkunden"
                        : "Seguir explorando"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white">
                        {locale === "de"
                          ? "Deine Expedition"
                          : "Tu expedición"}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {collected.length}{" "}
                        {locale === "de" ? "Artikel" : "artículos"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !saving && setFinishOpen(false)}
                      className="shrink-0 text-white/60 hover:text-white transition-colors"
                      aria-label={locale === "de" ? "Schließen" : "Cerrar"}
                    >
                      <svg
                        className="h-5 w-5"
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

                  <div className="globe-articles-scroll min-h-0 flex-1 overflow-y-auto">
                    <ul className="divide-y divide-white/10">
                      {collected.map((a) => {
                        const title =
                          locale === "es" && a.isTranslatedES && a.titleES
                            ? a.titleES
                            : a.title;
                        return (
                          <li
                            key={a.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            {a.image ? (
                              <img
                                src={a.image}
                                alt=""
                                loading="lazy"
                                className="h-11 w-11 shrink-0 object-cover bg-white/5"
                              />
                            ) : (
                              <div className="h-11 w-11 shrink-0 bg-white/5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-snug text-gray-100 line-clamp-2">
                                {title}
                              </span>
                              {a.author && (
                                <span className="text-[11px] text-gray-500">
                                  {a.author}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCollected((prev) =>
                                  prev.filter((x) => x.id !== a.id)
                                )
                              }
                              className="shrink-0 text-white/40 hover:text-[#89B881] transition-colors"
                              aria-label={
                                locale === "de" ? "Entfernen" : "Quitar"
                              }
                            >
                              <svg
                                className="h-4 w-4"
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
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="border-t border-white/10 p-4">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
                      {locale === "de"
                        ? "Name der Expedition"
                        : "Nombre de la expedición"}
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={expeditionName}
                      onChange={(e) => setExpeditionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !saving) saveExpedition();
                      }}
                      maxLength={120}
                      disabled={saving}
                      placeholder={
                        locale === "de"
                          ? "z. B. Musik in Argentinien"
                          : "p. ej. Música en Argentina"
                      }
                      className="w-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#89B881]"
                    />

                    {saveResult === "auth" && (
                      <p className="mt-2 text-xs text-amber-400">
                        {locale === "de"
                          ? "Bitte melde dich an, um deine Expedition zu speichern."
                          : "Iniciá sesión para guardar tu expedición."}
                      </p>
                    )}
                    {saveResult === "error" && (
                      <p className="mt-2 text-xs text-[#ff6b6b]">
                        {locale === "de"
                          ? "Etwas ist schiefgelaufen. Versuch es erneut."
                          : "Algo salió mal. Probá de nuevo."}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => !saving && setFinishOpen(false)}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-60 transition-colors"
                      >
                        {locale === "de" ? "Abbrechen" : "Cancelar"}
                      </button>
                      <button
                        type="button"
                        onClick={saveExpedition}
                        disabled={saving || !expeditionName.trim()}
                        className="flex items-center gap-2 bg-[#557a4c] hover:bg-[#46663f] px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {locale === "de" ? "Speichert…" : "Guardando…"}
                          </>
                        ) : locale === "de" ? (
                          "Expedition speichern"
                        ) : (
                          "Guardar expedición"
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

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
              className="w-full max-w-md max-h-[80vh] bg-[#0a0a0a] border-t-2 border-[#89B881] shadow-2xl flex flex-col"
            >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-[#557a4c] font-futura font-bold text-sm">
                  ila
                </span>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base truncate">
                    {panel.name}
                  </h3>
                  {panel.filtered && hasAnyFilter && (
                    <p className="truncate text-[11px] font-bold uppercase tracking-wide text-[#89B881]">
                      {activeFilters
                        .map((f) =>
                          locale === "es" && f.nameES ? f.nameES : f.name
                        )
                        .join(" · ")}
                    </p>
                  )}
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
              .globe-articles-scroll::-webkit-scrollbar-thumb { background: #89B881; }
              .globe-articles-scroll { scrollbar-width: thin; scrollbar-color: #89B881 rgba(255,255,255,0.06); }
            `}</style>
            <div className="globe-articles-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {panelData.loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-[#89B881] rounded-full animate-spin" />
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
                    const inPile = collectedIds.has(a.id);
                    const slim = {
                      id: a.id,
                      title: a.title,
                      titleES: a.titleES,
                      isTranslatedES: a.isTranslatedES,
                      legacyPath: a.legacyPath,
                      image: img || null,
                      author: author || null,
                      editionNumber: a.edition?.number || null,
                      topics: topics.map((tp) => ({ id: tp.id, name: tp.name })),
                      typeLabel: typeLabel || null,
                      isBookReview,
                      year: year || null,
                    };
                    return (
                      <li key={a.id} className="relative">
                        {canListen && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setListenId(a.id);
                            }}
                            aria-label={
                              locale === "de" ? "Anhören" : "Escuchar"
                            }
                            title={locale === "de" ? "Anhören" : "Escuchar"}
                            className="absolute right-11 top-2 z-10 flex h-7 w-7 items-center justify-center border border-white/25 bg-black/50 text-white/80 transition-colors hover:border-[#89B881] hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.536 8.464a5 5 0 010 7.072M12 6.5L7.5 10H4v4h3.5L12 17.5v-11z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCollect(slim, e);
                          }}
                          aria-label={
                            inPile
                              ? locale === "de"
                                ? "Aus der Expedition entfernen"
                                : "Quitar de la expedición"
                              : locale === "de"
                                ? "Zur Expedition hinzufügen"
                                : "Añadir a la expedición"
                          }
                          title={
                            inPile
                              ? locale === "de"
                                ? "In der Expedition"
                                : "En la expedición"
                              : locale === "de"
                                ? "Zur Expedition hinzufügen"
                                : "Añadir a la expedición"
                          }
                          className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center border transition-colors ${
                            inPile
                              ? "border-[#557a4c] bg-[#557a4c] text-white"
                              : "border-white/25 bg-black/50 text-white/80 hover:border-[#89B881] hover:text-white"
                          }`}
                        >
                          {inPile ? (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M12 5v14M5 12h14"
                              />
                            </svg>
                          )}
                        </button>
                        <Link
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                            canListen ? "pr-[4.75rem]" : "pr-11"
                          }`}
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
                                  className="text-[10px] font-bold uppercase tracking-wide text-[#89B881]"
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
                href={
                  activeFilters.length === 1 &&
                  activeFilters[0].kind === "topic"
                    ? `/${locale}/entities/topics/${activeFilters[0].id}`
                    : `/${locale}/entities/regions/${panel.regionId}`
                }
                className="block border-t border-white/10 px-5 py-3 text-center text-sm font-bold text-[#89B881] hover:bg-white/5 transition-colors"
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
