"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function CyberpunkGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);
  const linesRef = useRef<THREE.Group>(null);

  // Create grid material with custom opacity
  const gridMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({
      color: 0xf7931a,
      transparent: true,
      opacity: 0.08,
    });
    return material;
  }, []);

  // Create moving horizontal lines
  const movingLines = useMemo(() => {
    const lines: { position: number; speed: number }[] = [];
    for (let i = 0; i < 8; i++) {
      lines.push({
        position: Math.random() * 100 - 50,
        speed: 0.2 + Math.random() * 0.3,
      });
    }
    return lines;
  }, []);

  useFrame((state) => {
    if (gridRef.current) {
      // Subtle pulse effect on grid
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.02 + 0.08;
      (gridRef.current.material as THREE.LineBasicMaterial).opacity = pulse;
    }

    if (linesRef.current) {
      // Animate moving lines
      linesRef.current.children.forEach((child, i) => {
        const line = movingLines[i];
        if (line) {
          child.position.z += line.speed;
          if (child.position.z > 50) {
            child.position.z = -50;
          }
        }
      });
    }
  });

  return (
    <group>
      {/* Main floor grid */}
      <gridHelper
        ref={gridRef}
        args={[200, 100, 0xf7931a, 0x7e4912]}
        position={[0, -20, 0]}
      />

      {/* Moving horizontal scan lines */}
      <group ref={linesRef}>
        {movingLines.map((_, i) => (
          <mesh key={i} position={[0, -19.9, (i - 4) * 12]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 0.1]} />
            <meshBasicMaterial
              color={0xf7931a}
              transparent
              opacity={0.03 + Math.random() * 0.04}
            />
          </mesh>
        ))}
      </group>

      {/* Vertical grid columns */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`col-${i}`}
          position={[(i - 6) * 16, 20, -30]}
        >
          <boxGeometry args={[0.1, 80, 0.1]} />
          <meshBasicMaterial color={0xf7931a} transparent opacity={0.06} />
        </mesh>
      ))}

      {/* Glow points at grid intersections */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={`glow-${i}`}
          position={[
            (Math.random() - 0.5) * 160,
            -19.5,
            (Math.random() - 0.5) * 100,
          ]}
        >
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial
            color={0xf7931a}
            transparent
            opacity={0.15 + Math.random() * 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
