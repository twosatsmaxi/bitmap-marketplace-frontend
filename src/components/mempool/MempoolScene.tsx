"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { MempoolTransaction } from "./types/mempool";

interface MempoolSceneProps {
  transactions: MempoolTransaction[];
  newTransactions: MempoolTransaction[];
  maxParticles: number;
  onClearNew: () => void;
}

// Pre-allocated fee colors — avoids creating new THREE.Color every call
const FEE_COLORS = [
  new THREE.Color(0x7e4912), // feeRate < 10
  new THREE.Color(0xb87326), // feeRate < 50
  new THREE.Color(0xf7931a), // feeRate < 100
  new THREE.Color(0xffc12a), // feeRate < 500
  new THREE.Color(0xffeb3b), // feeRate >= 500
];

function getFeeColorIndex(feeRate: number): number {
  if (feeRate < 10) return 0;
  if (feeRate < 50) return 1;
  if (feeRate < 100) return 2;
  if (feeRate < 500) return 3;
  return 4;
}

// Size based on fee rate
function getParticleSize(tx: MempoolTransaction): number {
  const baseSize = 0.1 + Math.min(tx.feeRate / 500, 0.5);
  const sizeMultiplier = Math.min(tx.size / 500, 2);
  return baseSize * sizeMultiplier * 0.5;
}

interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  colorIndex: number;
  size: number;
  life: number;
  maxLife: number;
  instanceIndex: number;
}

function WebGLErrorFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-primary/30 flex items-center justify-center">
          <span className="text-2xl">⚡</span>
        </div>
        <h2 className="font-mono text-lg font-bold text-white mb-2">
          WebGL Not Available
        </h2>
        <p className="font-mono text-sm text-zinc-500">
          Your browser or device doesn&apos;t support WebGL, which is required for the 3D visualization.
        </p>
      </div>
    </div>
  );
}

export function MempoolScene({
  transactions,
  newTransactions,
  maxParticles,
  onClearNew,
}: MempoolSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const newTxQueueRef = useRef<MempoolTransaction[]>([]);
  const [webglError, setWebglError] = useState(false);

  // Add new transactions to queue
  useEffect(() => {
    if (newTransactions.length > 0) {
      newTxQueueRef.current.push(...newTransactions);
      onClearNew();
    }
  }, [newTransactions, onClearNew]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL support
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setWebglError(true);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 40);
    cameraRef.current = camera;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      setWebglError(true);
      return;
    }

    // Grid floor
    const gridHelper = new THREE.GridHelper(200, 100, 0xf7931a, 0x7e4912);
    gridHelper.position.y = -20;
    scene.add(gridHelper);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xf7931a, 0.3);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Shared geometry and material for InstancedMesh
    const geometry = new THREE.CapsuleGeometry(1, 4, 4, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    // InstancedMesh: single draw call for all particles
    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxParticles);
    instancedMesh.count = 0;
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);

    // Pre-allocate reusable dummy outside animation loop
    const dummy = new THREE.Object3D();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const particles = particlesRef.current;

      // Process new transactions
      while (newTxQueueRef.current.length > 0) {
        const tx = newTxQueueRef.current.shift();
        if (!tx) continue;
        if (particles.length >= maxParticles) break;

        const size = getParticleSize(tx);
        const colorIdx = getFeeColorIndex(tx.feeRate);
        const idx = particles.length;

        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 120,
          40 + Math.random() * 20,
          (Math.random() - 0.5) * 60
        );

        // Set instance transform
        dummy.position.copy(position);
        dummy.rotation.set(Math.PI, 0, 0);
        dummy.scale.setScalar(size);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx, dummy.matrix);
        instancedMesh.setColorAt(idx, FEE_COLORS[colorIdx]);

        particles.push({
          id: tx.id,
          position,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            -(0.3 + Math.random() * 0.4 + tx.feeRate / 1000),
            (Math.random() - 0.5) * 0.1
          ),
          colorIndex: colorIdx,
          size,
          life: 0,
          maxLife: 200 + Math.random() * 100,
          instanceIndex: idx,
        });

        instancedMesh.count = particles.length;
      }

      // Update particles (iterate backwards for safe removal)
      let needsColorUpdate = false;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Check if particle is dead
        if (p.life >= p.maxLife || p.position.y < -25) {
          // Swap with last active particle
          const lastIdx = particles.length - 1;
          if (i < lastIdx) {
            const last = particles[lastIdx];
            // Copy last particle's transform to this slot
            instancedMesh.getMatrixAt(last.instanceIndex, dummy.matrix);
            instancedMesh.setMatrixAt(p.instanceIndex, dummy.matrix);
            instancedMesh.setColorAt(p.instanceIndex, FEE_COLORS[last.colorIndex]);
            last.instanceIndex = p.instanceIndex;
            particles[i] = last;
            needsColorUpdate = true;
          }
          particles.pop();
          instancedMesh.count = particles.length;
          continue;
        }

        // Update position
        p.position.add(p.velocity);

        // Fade out via scale shrink (InstancedMesh shares one material, can't fade individually)
        let scale = p.size;
        if (p.life > p.maxLife * 0.7) {
          const t = 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3);
          scale = p.size * t;
        }

        dummy.position.copy(p.position);
        dummy.rotation.set(Math.PI, 0, 0);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(p.instanceIndex, dummy.matrix);
      }

      // Mark buffers for GPU upload
      if (particles.length > 0) {
        instancedMesh.instanceMatrix.needsUpdate = true;
        if (needsColorUpdate && instancedMesh.instanceColor) {
          instancedMesh.instanceColor.needsUpdate = true;
        }
      }

      // Camera parallax
      if (cameraRef.current) {
        const targetX = mouseRef.current.y * 0.1;
        const targetY = mouseRef.current.x * 0.1;
        cameraRef.current.rotation.x += (targetX - cameraRef.current.rotation.x) * 0.05;
        cameraRef.current.rotation.y += (targetY - cameraRef.current.rotation.y) * 0.05;
      }

      // Grid pulse
      const pulse = Math.sin(now * 0.0005) * 0.02 + 0.08;
      (gridHelper.material as THREE.LineBasicMaterial).opacity = pulse;

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      particlesRef.current = [];

      scene.remove(instancedMesh);
      instancedMesh.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [maxParticles]);

  if (webglError) {
    return <WebGLErrorFallback />;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ cursor: "crosshair" }}
    />
  );
}
