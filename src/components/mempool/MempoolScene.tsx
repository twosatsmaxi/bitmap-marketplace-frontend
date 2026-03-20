"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CyberpunkGrid } from "./CyberpunkGrid";
import { TransactionRain } from "./TransactionRain";
import type { MempoolTransaction } from "./types/mempool";

interface CameraControllerProps {
  mouseX: number;
  mouseY: number;
}

function CameraController({ mouseX, mouseY }: CameraControllerProps) {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame(() => {
    // Smooth camera parallax based on mouse position
    targetRotation.current.x = mouseY * 0.1;
    targetRotation.current.y = mouseX * 0.1;

    camera.rotation.x += (targetRotation.current.x - camera.rotation.x) * 0.05;
    camera.rotation.y += (targetRotation.current.y - camera.rotation.y) * 0.05;
  });

  return null;
}

interface SceneContentProps {
  transactions: MempoolTransaction[];
  newTransactions: MempoolTransaction[];
  maxParticles: number;
  onClearNew: () => void;
  mouseX: number;
  mouseY: number;
}

function SceneContent({
  transactions,
  newTransactions,
  maxParticles,
  onClearNew,
  mouseX,
  mouseY,
}: SceneContentProps) {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.1} />

      {/* Directional light for depth */}
      <directionalLight position={[10, 20, 10]} intensity={0.3} color={0xf7931a} />

      {/* Camera with mouse parallax */}
      <CameraController mouseX={mouseX} mouseY={mouseY} />

      {/* Grid floor */}
      <CyberpunkGrid />

      {/* Falling transactions */}
      <TransactionRain
        transactions={transactions}
        newTransactions={newTransactions}
        maxParticles={maxParticles}
        onClearNew={onClearNew}
      />
    </>
  );
}

interface MempoolSceneProps {
  transactions: MempoolTransaction[];
  newTransactions: MempoolTransaction[];
  maxParticles: number;
  onClearNew: () => void;
}

export function MempoolScene({
  transactions,
  newTransactions,
  maxParticles,
  onClearNew,
}: MempoolSceneProps) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to -1 to 1
      setMouseX((e.clientX / window.innerWidth) * 2 - 1);
      setMouseY((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{
          position: [0, 5, 40],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{
          background: "#09090b",
        }}
      >
        <SceneContent
          transactions={transactions}
          newTransactions={newTransactions}
          maxParticles={maxParticles}
          onClearNew={onClearNew}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      </Canvas>
    </div>
  );
}
