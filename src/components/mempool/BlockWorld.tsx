"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Bitmap } from "@/lib/types";

interface BlockWorldProps {
  blocks: Bitmap[];
  onBlockClick?: (block: Bitmap) => void;
  selectedBlock?: string | null;
}

// Color mapping for bitmap types
const TYPE_COLORS: Record<string, number> = {
  city: 0xf7931a,      // Orange
  grid: 0x10b981,      // Green
  mondrian: 0x3b82f6,  // Blue
  punk: 0xec4899,      // Pink
  palindrome: 0x8b5cf6, // Purple
};

// Generate mock blocks if needed
function generateMockBlocks(count: number): Bitmap[] {
  const types = ["city", "grid", "mondrian", "punk", "palindrome"] as const;
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `${800000 + i}.bitmap`,
    blockNumber: 800000 + i,
    inscriptionId: `mock-${i}`,
    owner: `bc1q${Math.random().toString(36).substring(2, 15)}`,
    genesisHeight: 800000 + i,
    bitmapType: types[Math.floor(Math.random() * types.length)],
    rarity: rarities[Math.floor(Math.random() * rarities.length)],
    traits: [],
    listingStatus: Math.random() > 0.7 ? "listed" : "unlisted",
    price: Math.random() > 0.7 ? Math.floor(Math.random() * 1000000) : undefined,
    txid: `txid-${i}`,
  }));
}

export function BlockWorld({ blocks: propBlocks, onBlockClick, selectedBlock }: BlockWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const blockMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredBlockRef = useRef<string | null>(null);
  const frameIdRef = useRef<number>(0);
  
  const [blocks, setBlocks] = useState<Bitmap[]>(propBlocks || generateMockBlocks(50));
  const [webglError, setWebglError] = useState(false);

  // Initialize blocks if not provided
  useEffect(() => {
    if (propBlocks && propBlocks.length > 0) {
      setBlocks(propBlocks);
    }
  }, [propBlocks]);

  // Create block mesh
  const createBlockMesh = useCallback((bitmap: Bitmap, x: number, z: number) => {
    const group = new THREE.Group();
    
    // Block dimensions (800x150 aspect ratio)
    const width = 8;
    const depth = 1.5;
    const height = Math.random() * 3 + 2; // Random height for variety
    
    const color = TYPE_COLORS[bitmap.bitmapType] || 0xf7931a;
    
    // Main block geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ 
      color,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add glow effect for rare/epic/legendary
    if (["rare", "epic", "legendary"].includes(bitmap.rarity)) {
      const glowGeometry = new THREE.BoxGeometry(width + 0.2, height + 0.2, depth + 0.2);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = height / 2;
      group.add(glow);
    }
    
    // Add block number label (simplified as a small plane)
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, height + 0.5, 0);
    label.rotation.x = -Math.PI / 4;
    group.add(label);
    
    group.add(mesh);
    group.position.set(x, 0, z);
    
    // Store metadata
    (group as any).userData = { bitmap, originalY: 0 };
    
    return group;
  }, []);

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
    scene.fog = new THREE.Fog(0x09090b, 50, 200);
    sceneRef.current = scene;

    // Camera (isometric-like angle)
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(50, 40, 50);
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
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below ground
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf7931a, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    scene.add(dirLight);

    // Ground plane with grid
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x121214,
      transparent: true,
      opacity: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(500, 100, 0xf7931a, 0x27272a);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Create blocks in a spiral pattern
    const spiralBlocks = blocks.slice(0, 100);
    const blockMeshes = new Map<string, THREE.Group>();
    
    spiralBlocks.forEach((bitmap, index) => {
      // Spiral layout
      const angle = index * 0.5;
      const radius = 5 + index * 1.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const blockGroup = createBlockMesh(bitmap, x, z);
      scene.add(blockGroup);
      blockMeshes.set(bitmap.id, blockGroup);
    });
    
    blockMeshesRef.current = blockMeshes;

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      if (hoveredBlockRef.current && onBlockClick) {
        const block = blocks.find(b => b.id === hoveredBlockRef.current);
        if (block) onBlockClick(block);
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

      // Raycasting for hover effects
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      const intersectObjects: THREE.Object3D[] = [];
      blockMeshes.forEach((group) => {
        group.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            intersectObjects.push(child);
          }
        });
      });

      const intersects = raycasterRef.current.intersectObjects(intersectObjects);
      
      // Reset previous hover
      if (hoveredBlockRef.current) {
        const prevGroup = blockMeshes.get(hoveredBlockRef.current);
        if (prevGroup) {
          prevGroup.position.y = (prevGroup as any).userData.originalY;
          prevGroup.scale.setScalar(1);
        }
        hoveredBlockRef.current = null;
        document.body.style.cursor = "default";
      }

      // Apply new hover
      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const group = hitObject.parent as THREE.Group;
        if (group && (group as any).userData?.bitmap) {
          const bitmapId = (group as any).userData.bitmap.id;
          hoveredBlockRef.current = bitmapId;
          
          // Float up and scale
          group.position.y = 1;
          group.scale.setScalar(1.1);
          
          document.body.style.cursor = "pointer";
        }
      }

      // Animate selected block
      if (selectedBlock) {
        const selectedGroup = blockMeshes.get(selectedBlock);
        if (selectedGroup) {
          const time = Date.now() * 0.003;
          selectedGroup.position.y = 1 + Math.sin(time) * 0.3;
          selectedGroup.rotation.y += 0.01;
        }
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
      
      blockMeshes.forEach((group) => {
        scene.remove(group);
      });
      blockMeshes.clear();
      
      controls.dispose();
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [blocks, createBlockMesh, onBlockClick, selectedBlock]);

  if (webglError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg">
        <div className="text-center max-w-md px-6">
          <h2 className="font-mono text-lg font-bold text-white mb-2">
            WebGL Not Available
          </h2>
          <p className="font-mono text-sm text-zinc-500">
            Your browser doesn&apos;t support WebGL, which is required for the 3D world.
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
