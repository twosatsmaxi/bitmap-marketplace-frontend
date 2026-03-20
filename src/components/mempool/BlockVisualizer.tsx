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

/** Map bucket value (1-6) to bubble radius */
function getBucketRadius(bucket: number): number {
  return 0.15 + bucket * 0.12;
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

    // Camera
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 8, 25);
    camera.lookAt(0, 0, 0);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setWebglError(true);
      return;
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 60;
    controls.target.set(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf7931a, 0.6, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Shared geometries per bucket size (performance)
    const geometries = new Map<number, THREE.SphereGeometry>();
    for (let b = 1; b <= 6; b++) {
      geometries.set(b, new THREE.SphereGeometry(getBucketRadius(b), 16, 12));
    }

    // Create bubbles — cap at 2000 for performance
    const txGroup = new THREE.Group();
    scene.add(txGroup);

    const visibleCount = Math.min(blockBytes.length, 2000);
    const spreadRadius = Math.sqrt(visibleCount) * 0.5;

    interface BubbleData {
      velocity: THREE.Vector3;
      originalY: number;
      index: number;
      bucket: number;
    }

    const bubbles: { mesh: THREE.Mesh; data: BubbleData }[] = [];

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const color = getBucketColor(bucket);
      const geometry = geometries.get(bucket)!;

      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        emissive: color,
        emissiveIntensity: 0.2,
        roughness: 0.2,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spreadRadius * Math.cbrt(Math.random());
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      mesh.position.set(x, y, z);
      mesh.name = String(i);
      mesh.userData = { index: i, bucket, originalY: y };

      txGroup.add(mesh);

      bubbles.push({
        mesh,
        data: {
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
          ),
          originalY: y,
          index: i,
          bucket,
        },
      });
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
    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      controls.update();

      // Animate bubbles — gentle floating
      for (const { mesh, data } of bubbles) {
        mesh.position.x += data.velocity.x;
        mesh.position.y += data.velocity.y;
        mesh.position.z += data.velocity.z;

        // Soft boundary — keep within spread radius
        const dist = mesh.position.length();
        if (dist > spreadRadius) {
          // Nudge back toward center
          const pullback = mesh.position.clone().normalize().multiplyScalar(-0.002);
          data.velocity.add(pullback);
        }

        // Damping + small random drift
        data.velocity.multiplyScalar(0.998);
        data.velocity.x += (Math.random() - 0.5) * 0.0003;
        data.velocity.y += (Math.random() - 0.5) * 0.0003;
        data.velocity.z += (Math.random() - 0.5) * 0.0003;
      }

      // Slow rotation of the whole group
      txGroup.rotation.y += dt * 0.05;

      // Raycasting for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(txGroup.children);

      if (hoveredName !== null) {
        const prevMesh = txGroup.getObjectByName(hoveredName) as THREE.Mesh;
        if (prevMesh) {
          prevMesh.scale.setScalar(1);
          (prevMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        }
        hoveredName = null;
        document.body.style.cursor = "default";
      }

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        hoveredName = hitMesh.name;
        hitMesh.scale.setScalar(1.4);
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
      geometries.forEach(g => g.dispose());
      txGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
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
