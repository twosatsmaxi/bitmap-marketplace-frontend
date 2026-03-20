"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Transaction {
  txid: string;
  size: number;
  fee: number;
  inputs: number;
  outputs: number;
}

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  size: number;
  tx_count: number;
  transactions: Transaction[];
}

interface BlockVisualizerProps {
  blockData: BlockData;
  onTransactionClick?: (tx: Transaction) => void;
}

// Color based on fee rate (fee per byte)
function getTransactionColor(fee: number, size: number): number {
  const feeRate = fee / size;
  if (feeRate < 10) return 0x7e4912;
  if (feeRate < 50) return 0xb87326;
  if (feeRate < 100) return 0xf7931a;
  if (feeRate < 500) return 0xffc12a;
  return 0xffeb3b;
}

// Size based on transaction size
function getTransactionSize(tx: Transaction): number {
  const normalizedSize = Math.min(tx.size / 1000, 3);
  return 0.5 + normalizedSize * 0.8;
}

export function BlockVisualizer({ blockData, onTransactionClick }: BlockVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const onTransactionClickRef = useRef(onTransactionClick);
  onTransactionClickRef.current = onTransactionClick;

  // Single effect that handles everything — Strict Mode safe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WebGL check
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) {
      setWebglError(true);
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(25, 20, 25);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglError(true);
      return;
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 10;
    controls.maxDistance = 150;
    controls.target.set(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf7931a, 0.5, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x121214, transparent: true, opacity: 0.6 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(100, 50, 0xf7931a, 0x27272a);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Transaction group
    const txGroup = new THREE.Group();
    scene.add(txGroup);

    // Create transaction cubes
    const transactions = blockData.transactions.slice(0, 200);
    const cols = Math.ceil(Math.sqrt(transactions.length));
    const spacing = 2.5;

    transactions.forEach((tx, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      const size = getTransactionSize(tx);
      const color = getTransactionColor(tx.fee, tx.size);
      const height = 0.3 + (tx.fee / 100000) * 2;

      const geometry = new THREE.BoxGeometry(size, Math.max(height, 0.5), size);
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(x, height / 2, z);
      mesh.name = tx.txid;
      mesh.userData = { tx, originalY: height / 2 };
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      txGroup.add(mesh);
    });

    // Interaction state
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let hoveredTxId: string | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      if (hoveredTxId && onTransactionClickRef.current) {
        const tx = transactions.find(t => t.txid === hoveredTxId);
        if (tx) onTransactionClickRef.current(tx);
      }
    };

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    // Animation loop
    let disposed = false;
    const animate = () => {
      if (disposed) return;
      controls.update();

      // Raycasting
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(txGroup.children);

      // Reset previous hover
      if (hoveredTxId) {
        const prevMesh = txGroup.getObjectByName(hoveredTxId) as THREE.Mesh;
        if (prevMesh) {
          prevMesh.position.y = prevMesh.userData.originalY;
          prevMesh.scale.setScalar(1);
          (prevMesh.material as THREE.MeshStandardMaterial).opacity = 0.9;
          (prevMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
        hoveredTxId = null;
        document.body.style.cursor = "default";
      }

      // Apply new hover
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        hoveredTxId = hitMesh.name;

        hitMesh.position.y = hitMesh.userData.originalY + 0.5;
        hitMesh.scale.setScalar(1.1);
        (hitMesh.material as THREE.MeshStandardMaterial).opacity = 1;
        (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
        document.body.style.cursor = "pointer";
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup — directly reference the DOM element, not the ref
    const domElement = renderer.domElement;
    return () => {
      disposed = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      // Remove this specific canvas element, not via containerRef
      domElement.remove();
      // Dispose all geometries and materials
      txGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    };
  }, [blockData]);

  if (webglError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg">
        <div className="text-center max-w-md px-6">
          <h2 className="font-mono text-lg font-bold text-white mb-2">WebGL Not Available</h2>
          <p className="font-mono text-sm text-zinc-500">Your browser doesn&apos;t support WebGL.</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="absolute inset-0" style={{ cursor: "grab" }} />;
}
