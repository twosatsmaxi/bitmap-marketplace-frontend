"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface BlockVisualizerProps {
  /** 1 byte per tx — values 1-6 (log₁₀ output value buckets) */
  blockBytes: Uint8Array;
  onTransactionClick?: (index: number) => void;
}

/** Map bucket value (1-6) to color */
function getBucketColor(bucket: number): number {
  switch (bucket) {
    case 1: return 0x7e4912;
    case 2: return 0xa05a1a;
    case 3: return 0xb87326;
    case 4: return 0xf7931a;
    case 5: return 0xffc12a;
    case 6: return 0xffeb3b;
    default: return 0x7e4912;
  }
}

/** Map bucket value (1-6) to cube size */
function getBucketSize(bucket: number): number {
  return 0.4 + bucket * 0.3;
}

export function BlockVisualizer({ blockBytes, onTransactionClick }: BlockVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const onClickRef = useRef(onTransactionClick);
  onClickRef.current = onTransactionClick;

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

    // Camera — position based on tx count
    const txCount = blockBytes.length;
    const cols = Math.ceil(Math.sqrt(Math.min(txCount, 2000)));
    const gridSpan = cols * 2.5;
    const camDist = Math.max(gridSpan * 0.6, 25);
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(camDist, camDist * 0.7, camDist);

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
    controls.maxDistance = camDist * 3;
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

    const pointLight = new THREE.PointLight(0xf7931a, 0.5, camDist * 2);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Ground
    const groundSize = gridSpan * 2;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x121214, transparent: true, opacity: 0.6 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(groundSize, Math.min(cols * 2, 100), 0xf7931a, 0x27272a);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Transaction cubes — cap at 2000 for performance
    const txGroup = new THREE.Group();
    scene.add(txGroup);

    const visibleCount = Math.min(txCount, 2000);
    const spacing = 2.5;

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      const size = getBucketSize(bucket);
      const color = getBucketColor(bucket);
      const height = 0.3 + bucket * 0.4;

      const geometry = new THREE.BoxGeometry(size, height, size);
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
      mesh.name = String(i);
      mesh.userData = { index: i, bucket, originalY: height / 2 };
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      txGroup.add(mesh);
    }

    // Interaction state
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let hoveredName: string | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      if (hoveredName !== null && onClickRef.current) {
        onClickRef.current(parseInt(hoveredName, 10));
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

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(txGroup.children);

      // Reset previous hover
      if (hoveredName !== null) {
        const prevMesh = txGroup.getObjectByName(hoveredName) as THREE.Mesh;
        if (prevMesh) {
          prevMesh.position.y = prevMesh.userData.originalY;
          prevMesh.scale.setScalar(1);
          (prevMesh.material as THREE.MeshStandardMaterial).opacity = 0.9;
          (prevMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
        hoveredName = null;
        document.body.style.cursor = "default";
      }

      // Apply new hover
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        hoveredName = hitMesh.name;

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

    // Cleanup
    const domElement = renderer.domElement;
    return () => {
      disposed = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      domElement.remove();
      txGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    };
  }, [blockBytes]);

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

  return <div ref={containerRef} className="absolute inset-0" style={{ top: "var(--header-total)", cursor: "grab" }} />;
}
