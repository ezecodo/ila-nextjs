"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Función para convertir coordenadas lat/lon a posición en esfera
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function IsolatedThreeScene({
  countryCoordinates = {},
  countryColors = {},
}) {
  const mountRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- ESCENA Y RENDERER ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5; // Más lejos = mapa más pequeño

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    // Mejora de color
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();

    // --- LUCES (Iluminación de estudio) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // --- GLOBO TERRÁQUEO ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const globeGeometry = new THREE.SphereGeometry(0.8, 64, 64); // Globo más pequeño

    // Texturas de alta calidad
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

    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globe);

    // --- NUBES ---
    const cloudsGeometry = new THREE.SphereGeometry(0.82, 64, 64); // Nubes más pequeñas
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png"
      ),
      transparent: true,
      opacity: 0.5,
      depthWrite: false, // Evita fallos visuales con la esfera de abajo
    });
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    globeGroup.add(clouds);

    // --- EFECTO DE ATMÓSFERA (Glow azulado) ---
    const atmosphereGeometry = new THREE.SphereGeometry(1.0, 64, 64); // Atmósfera más pequeña
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
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // --- PUNTOS DE PAÍSES ---
    const countryPoints = [];
    Object.entries(countryCoordinates).forEach(([code, coords]) => {
      const position = latLonToVector3(coords.lat, coords.lon, 0.83); // Puntos más cerca del globo pequeño
      const color = new THREE.Color(countryColors[code] || "#00ffcc");

      const pointGeo = new THREE.SphereGeometry(0.025, 16, 16); // Más grande
      const pointMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const point = new THREE.Mesh(pointGeo, pointMat);
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

    // --- INTERACCIÓN ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    renderer.domElement.addEventListener("mousemove", onPointerMove);

    // --- ANIMACIÓN ---
    const animate = () => {
      requestAnimationFrame(animate);

      // Raycasting para hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(countryPoints);

      // Resetear todos los puntos primero
      countryPoints.forEach((point) => {
        point.scale.set(1, 1, 1);
        if (point.material.emissive) {
          point.material.emissiveIntensity = 0.3;
        }
      });

      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        document.body.style.cursor = "pointer";
        // Resaltar punto
        intersected.scale.set(1.5, 1.5, 1.5);
        if (intersected.material.emissive) {
          intersected.material.emissiveIntensity = 0.8;
        }
      } else {
        document.body.style.cursor = "default";
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();
    setIsInitialized(true);

    // Limpieza
    return () => {
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100vh", background: "#000" }}
    >
      {!isInitialized && (
        <p style={{ color: "white" }}>Cargando Mundo Real...</p>
      )}
    </div>
  );
}
