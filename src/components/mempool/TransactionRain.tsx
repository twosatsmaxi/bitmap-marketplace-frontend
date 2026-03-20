"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MempoolTransaction, ParticleData } from "./types/mempool";

interface TransactionRainProps {
  transactions: MempoolTransaction[];
  newTransactions: MempoolTransaction[];
  maxParticles: number;
  onClearNew: () => void;
}

// Color based on fee rate (low = dark orange, high = bright yellow)
function getFeeColor(feeRate: number): THREE.Color {
  const color = new THREE.Color();
  if (feeRate < 10) {
    color.setHex(0x7e4912); // Dark brown-orange
  } else if (feeRate < 50) {
    color.setHex(0xb87326); // Medium orange
  } else if (feeRate < 100) {
    color.setHex(0xf7931a); // Primary orange
  } else if (feeRate < 500) {
    color.setHex(0xffc12a); // Bright yellow-orange
  } else {
    color.setHex(0xffeb3b); // Bright yellow (high priority)
  }
  return color;
}

// Size based on fee rate and transaction size
function getParticleSize(tx: MempoolTransaction): number {
  const baseSize = 0.1 + Math.min(tx.feeRate / 500, 0.5);
  const sizeMultiplier = Math.min(tx.size / 500, 2);
  return baseSize * sizeMultiplier * 0.3;
}

export function TransactionRain({
  transactions,
  newTransactions,
  maxParticles,
  onClearNew,
}: TransactionRainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<ParticleData[]>([]);
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());

  // Geometry for a glowing particle (elongated for motion blur effect)
  const geometry = useMemo(() => {
    return new THREE.CapsuleGeometry(1, 4, 4, 8);
  }, []);

  // Material with additive blending for glow effect
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Add new transactions as particles
  useEffect(() => {
    if (newTransactions.length === 0) return;

    newTransactions.forEach((tx) => {
      const particle: ParticleData = {
        id: tx.id,
        position: [
          (Math.random() - 0.5) * 120, // Random X spread
          40 + Math.random() * 20, // Start above viewport
          (Math.random() - 0.5) * 60, // Random Z depth
        ],
        velocity: [
          (Math.random() - 0.5) * 0.1, // Slight horizontal drift
          -(0.3 + Math.random() * 0.4 + tx.feeRate / 1000), // Faster fall = higher fee
          (Math.random() - 0.5) * 0.1,
        ],
        feeRate: tx.feeRate,
        size: getParticleSize(tx),
        opacity: 1,
        life: 0,
        maxLife: 200 + Math.random() * 100,
      };

      particlesRef.current.push(particle);
    });

    onClearNew();
  }, [newTransactions, onClearNew]);

  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;

    const particles = particlesRef.current;

    // Update particle physics
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Update position
      p.position[0] += p.velocity[0];
      p.position[1] += p.velocity[1];
      p.position[2] += p.velocity[2];

      // Update life
      p.life++;

      // Fade out near end of life
      if (p.life > p.maxLife * 0.7) {
        p.opacity = 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3);
      }

      // Remove dead particles
      if (p.life >= p.maxLife || p.position[1] < -25) {
        particles.splice(i, 1);
      }
    }

    // Limit total particles
    if (particles.length > maxParticles) {
      particles.splice(0, particles.length - maxParticles);
    }

    // Update instanced mesh
    let instanceIndex = 0;
    for (const p of particles) {
      if (instanceIndex >= maxParticles) break;

      dummyRef.current.position.set(...p.position);
      dummyRef.current.scale.set(p.size, p.size, p.size);
      dummyRef.current.rotation.x = Math.PI; // Point downward
      dummyRef.current.updateMatrix();

      meshRef.current.setMatrixAt(instanceIndex, dummyRef.current.matrix);

      // Color based on fee rate
      colorRef.current = getFeeColor(p.feeRate);
      meshRef.current.setColorAt(instanceIndex, colorRef.current);

      instanceIndex++;
    }

    // Hide unused instances
    for (let i = instanceIndex; i < maxParticles; i++) {
      dummyRef.current.position.set(0, -1000, 0);
      dummyRef.current.updateMatrix();
      meshRef.current.setMatrixAt(i, dummyRef.current.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, maxParticles]}
      frustumCulled={false}
    />
  );
}
