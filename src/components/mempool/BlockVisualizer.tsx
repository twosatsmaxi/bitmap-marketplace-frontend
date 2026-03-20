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
  if (feeRate < 10) return 0x7e4912;      // Low fee - dark
  if (feeRate < 50) return 0xb87326;      // Medium-low
  if (feeRate < 100) return 0xf7931a;     // Medium - orange
  if (feeRate < 500) return 0xffc12a;     // High - yellow
  return 0xffeb3b;                        // Very high - bright yellow
}

// Size based on transaction size
function getTransactionSize(tx: Transaction): number {
  const normalizedSize = Math.min(tx.size / 1000, 3);
  return 0.5 + normalizedSize * 0.8;
}

export function BlockVisualizer({ blockData, onTransactionClick }: BlockVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const txMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredTxRef = useRef<string | null>(null);
  const frameIdRef = useRef<number>(0);
  const [webglError, setWebglError] = useState(false);

  // Helper function removed - logic moved inline

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setWebglError(true);
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.Fog(0x09090b, 30, 100);
    sceneRef.current = scene;

    // Camera - isometric angle
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(40, 35, 40);
    cameraRef.current = camera;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
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
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf7931a, 0.8);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x121214,
      transparent: true,
      opacity: 0.6,
    });
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

    // Create transaction cubes in a packed layout
    const transactions = blockData.transactions.slice(0, 200);
    const txMeshes = new Map<string, THREE.Mesh>();
    
    // Calculate grid dimensions for a square-ish layout
    const count = transactions.length;
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 2.5;
    
    transactions.forEach((tx, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      // Offset to center
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;
      
      // Create mesh
      const size = getTransactionSize(tx);
      const color = getTransactionColor(tx.fee, tx.size);
      const height = 0.3 + (tx.fee / 100000) * 2;
      
      const geometry = new THREE.BoxGeometry(size, height, size);
      const material = new THREE.MeshLambertMaterial({ 
        color,
        transparent: true,
        opacity: 0.9,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, height / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      (mesh as any).userData = { tx, originalY: height / 2 };
      
      scene.add(mesh);
      txMeshes.set(tx.txid, mesh);
    });
    
    txMeshesRef.current = txMeshes;

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      if (hoveredTxRef.current && onTransactionClick) {
        const tx = blockData.transactions.find(t => t.txid === hoveredTxRef.current);
        if (tx) onTransactionClick(tx);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      controls.update();

      // Raycasting for hover
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(txMeshes.values())
      );
      
      // Reset previous hover
      if (hoveredTxRef.current) {
        const prevMesh = txMeshes.get(hoveredTxRef.current);
        if (prevMesh) {
          prevMesh.position.y = (prevMesh as any).userData.originalY;
          prevMesh.scale.setScalar(1);
          (prevMesh.material as THREE.MeshLambertMaterial).opacity = 0.9;
        }
        hoveredTxRef.current = null;
        document.body.style.cursor = "default";
      }

      // Apply new hover
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const txid = (hitMesh as any).userData.tx.txid;
        hoveredTxRef.current = txid;
        
        // Highlight effect
        hitMesh.position.y = (hitMesh as any).userData.originalY + 0.5;
        hitMesh.scale.setScalar(1.1);
        (hitMesh.material as THREE.MeshLambertMaterial).opacity = 1;
        
        document.body.style.cursor = "pointer";
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      
      txMeshes.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      txMeshes.clear();
      
      controls.dispose();
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [blockData, onTransactionClick]);

  if (webglError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg">
        <div className="text-center max-w-md px-6">
          <h2 className="font-mono text-lg font-bold text-white mb-2">
            WebGL Not Available
          </h2>
          <p className="font-mono text-sm text-zinc-500">
            Your browser doesn&apos;t support WebGL, which is required for the 3D visualization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ cursor: "grab" }}
    />
  );
}
