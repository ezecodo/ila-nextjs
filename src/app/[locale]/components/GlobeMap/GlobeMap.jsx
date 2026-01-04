"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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

  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [articleCount, setArticleCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleCountryHover = async (code) => {
    setHoveredCountry(code);
    if (code) {
      const regionId = countryToRegionId[code];
      if (regionId) {
        try {
          const res = await fetch(
            `/api/count/regions/${regionId}?context=articles`
          );
          const data = await res.json();
          setArticleCount(data.count ?? 0);
        } catch (err) {
          setArticleCount(null);
        }
      }
    } else {
      setArticleCount(null);
    }
  };

  const tooltipName = hoveredCountry
    ? countryNames[hoveredCountry]?.[locale] || countryNames[hoveredCountry]?.de
    : null;

  const handleCountryClick = (countryCode) => {
    const regionId = countryToRegionId[countryCode];
    if (regionId) {
      window.open(`/${locale}/entities/regions/${regionId}`, "_blank");
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    let animationId;
    let currentHovered = null;

    // --- ESCENA ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- FONDO NEGRO ---
    scene.background = new THREE.Color(0x000000);

    // --- ESTRELLAS ---
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Posiciones aleatorias en una esfera grande
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // --- LUCES ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // --- GLOBO ---
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = Math.PI;
    globeGroup.rotation.x = 0.16;
    globeGroup.rotation.y = 0.5;
    scene.add(globeGroup);

    const textureLoader = new THREE.TextureLoader();
    const globeGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg"
      ),
      bumpMap: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg"
      ),
      bumpScale: 0.02,
      specularMap: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg"
      ),
      specular: new THREE.Color("grey"),
      shininess: 10,
    });
    globeGroup.add(new THREE.Mesh(globeGeometry, globeMaterial));

    // --- NUBES ---
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png"
      ),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    globeGroup.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.82, 64, 64), cloudsMaterial)
    );

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
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    scene.add(
      new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64), atmosphereMaterial)
    );

    // --- PUNTOS DE PAÍSES ---
    const countryPoints = [];
    Object.entries(countryCoordinates).forEach(([code, coords]) => {
      const position = latLonToVector3(coords.lat, coords.lon, 0.83);
      const color = new THREE.Color(countryColors[code] || "#00ffcc");

      const point = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.3,
        })
      );
      point.position.copy(position);
      point.userData = { countryCode: code };

      globeGroup.add(point);
      countryPoints.push(point);
    });

    // --- CONTROLES ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;

    // --- RAYCASTER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- EVENTOS ---
    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(countryPoints);

      // Reset todos
      countryPoints.forEach((p) => {
        p.scale.set(1, 1, 1);
        p.material.emissiveIntensity = 0.3;
      });

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const code = hit.userData.countryCode;

        hit.scale.set(1.5, 1.5, 1.5);
        hit.material.emissiveIntensity = 0.8;
        renderer.domElement.style.cursor = "pointer";

        if (currentHovered !== code) {
          currentHovered = code;
          handleCountryHover(code);
        }
      } else {
        renderer.domElement.style.cursor = "default";
        if (currentHovered !== null) {
          currentHovered = null;
          handleCountryHover(null);
        }
      }
    };

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(countryPoints);

      if (intersects.length > 0) {
        handleCountryClick(intersects[0].object.userData.countryCode);
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // --- ANIMACIÓN ---
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    setIsLoading(false);

    // --- RESIZE ---
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [locale]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      {/* Tooltip */}
      {hoveredCountry && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {tooltipName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {articleCount !== null
              ? `${articleCount} ${locale === "de" ? "Artikel" : "artículos"}`
              : "..."}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {locale === "de" ? "Klicken zum Erkunden" : "Click para explorar"}
          </p>
        </div>
      )}

      {/* Canvas container */}
      <div ref={mountRef} className="w-full h-full">
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white">Cargando globo 3D...</div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {locale === "de"
          ? "🖱️ Ziehen zum Drehen • Scrollen zum Zoomen"
          : "🖱️ Arrastra para rotar • Scroll para zoom"}
      </div>
    </div>
  );
}
