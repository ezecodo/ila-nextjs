"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function CountryPoint({
  countryCode,
  coords,
  radius,
  onHover,
  onClick,
  isHovered,
  color,
}) {
  const position = latLonToVector3(coords.lat, coords.lon, radius);

  return (
    <mesh
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(countryCode);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(countryCode);
      }}
      scale={isHovered ? 1.5 : 1}
    >
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isHovered ? 0.8 : 0.3}
      />
    </mesh>
  );
}

export function Globe({ children, rotationSpeed = 0.1 }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} metalness={0.2} />
      </Sphere>
      {children}
    </group>
  );
}

export function Stars() {
  const positions = useRef(new Float32Array(3000));

  if (positions.current.length === 3000) {
    for (let i = 0; i < 1000; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 100;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
  }

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffffff" sizeAttenuation />
    </points>
  );
}

export default function GlobeScene({
  countryCoordinates,
  countryColors,
  onCountryHover,
  onCountryClick,
  hoveredCountry,
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "#000000" }}
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <Stars />

      <Globe rotationSpeed={0.05}>
        {Object.entries(countryCoordinates).map(([code, coords]) => (
          <CountryPoint
            key={code}
            countryCode={code}
            coords={coords}
            radius={2.02}
            onHover={onCountryHover}
            onClick={onCountryClick}
            isHovered={hoveredCountry === code}
            color={countryColors[code] || "#ffffff"}
          />
        ))}
      </Globe>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={10}
      />
    </Canvas>
  );
}
