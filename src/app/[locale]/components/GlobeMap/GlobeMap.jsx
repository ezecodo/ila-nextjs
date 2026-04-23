"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
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

  const handleCountryClick = (countryCode) => {
    const regionId = countryToRegionId[countryCode];
    if (regionId) {
      window.open(`/${locale}/entities/regions/${regionId}`, "_blank");
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const markersData = [];

    // --- ESCENA ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 4.5;

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
    const rimLight = new THREE.SpotLight(0x4455ff, 5.0);
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
      map: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg"
      ),
      bumpMap: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg"
      ),
      bumpScale: 0.015,
      specularMap: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg"
      ),
      specular: new THREE.Color("grey"),
      shininess: 15,
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // --- NUBES ---
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png"
      ),
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
          background: rgba(17, 24, 39, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          min-width: 160px;
        ">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="
              background: white;
              border-radius: 4px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: #dc2626; font-weight: bold; font-size: 14px; font-family: 'Futura', Arial, sans-serif;">ila</span>
            </div>
            <span style="color: white; font-weight: bold; font-size: 16px;">${name}</span>
          </div>
          <div style="height: 1px; background: rgba(255,255,255,0.2); margin: 8px 0;"></div>
          <div style="color: #9ca3af; font-size: 12px;" class="article-count">
            <span style="color: #22d3ee;">...</span> ${locale === "de" ? "Artikel" : "artículos"}
          </div>
          <div style="color: #6b7280; font-size: 11px; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #22d3ee;"></span>
            ${locale === "de" ? "Klicken zum Erkunden" : "Click para explorar"}
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

    // --- FETCH ARTICLE COUNT ---
    const fetchArticleCount = async (code, tooltipElement) => {
      const regionId = countryToRegionId[code];
      if (!regionId) return;

      try {
        const res = await fetch(
          `/api/count/regions/${regionId}?context=articles`
        );
        const data = await res.json();
        const countSpan = tooltipElement.querySelector(".article-count span");
        if (countSpan) {
          countSpan.textContent = data.count ?? 0;
        }
      } catch (err) {
        console.error("Error fetching count:", err);
      }
    };

    // --- EVENTOS ---
    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

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
            fetchArticleCount(hitCode, hoveredPoint.userData.tooltipElement);
          }
        }
      }
    };

    const onClick = () => {
      if (currentHoveredCode) {
        handleCountryClick(currentHoveredCode);
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
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Contenedor Canvas + HTML Overlay */}
      <div ref={mountRef} className="w-full h-full bg-black">
        {isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white/80 text-sm tracking-widest uppercase">
              Initializing Globe
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-wider uppercase bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5 pointer-events-none">
        {locale === "de"
          ? "Interaktion: Drag • Scroll • Hover"
          : "Interacción: Arrastra • Scroll • Hover"}
      </div>
    </div>
  );
}
