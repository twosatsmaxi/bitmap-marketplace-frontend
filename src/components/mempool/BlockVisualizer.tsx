"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // Group transactions by bucket for instanced rendering
    const bucketGroups = new Map<number, { indices: number[]; positions: { x: number; z: number }[] }>();

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      if (!bucketGroups.has(bucket)) {
        bucketGroups.set(bucket, { indices: [], positions: [] });
      }
      const group = bucketGroups.get(bucket)!;
      group.indices.push(i);
      group.positions.push({ x, z });
    }

    // Mapping from (InstancedMesh uuid, instanceId) -> original transaction index
    const instanceToTxIndex = new Map<string, Map<number, number>>();
    // Store original heights per bucket for hover restoration
    const bucketHeights = new Map<string, number>();
    const dummy = new THREE.Object3D();

    for (const [bucket, group] of bucketGroups) {
      const size = getBucketSize(bucket);
      const color = getBucketColor(bucket);
      const height = 0.3 + bucket * 0.4;
      const count = group.indices.length;

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

      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      const meshIndexMap = new Map<number, number>();

      for (let j = 0; j < count; j++) {
        const { x, z } = group.positions[j];
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(j, dummy.matrix);
        instancedMesh.setColorAt(j, new THREE.Color(color));
        meshIndexMap.set(j, group.indices[j]);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.instanceColor!.needsUpdate = true;

      instanceToTxIndex.set(instancedMesh.uuid, meshIndexMap);
      bucketHeights.set(instancedMesh.uuid, height);

      txGroup.add(instancedMesh);
    }

    // Interaction state
    const mouse = new THREE.Vector2();
    const prevMouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let mouseNeedsCast = false;
    let hoveredMeshUuid: string | null = null;
    let hoveredInstanceId: number | null = null;
    let hoveredTxIndex: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX / window.innerWidth) * 2 - 1;
      const newY = -(e.clientY / window.innerHeight) * 2 + 1;
      if (newX !== prevMouse.x || newY !== prevMouse.y) {
        mouse.x = newX;
        mouse.y = newY;
        prevMouse.x = newX;
        prevMouse.y = newY;
        mouseNeedsCast = true;
      }
    };

    const handleClick = () => {
      if (hoveredTxIndex !== null && onClickRef.current) {
        onClickRef.current(hoveredTxIndex);
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

    // Temp objects for hover matrix manipulation
    const hoverMatrix = new THREE.Matrix4();
    const hoverPos = new THREE.Vector3();
    const hoverQuat = new THREE.Quaternion();
    const hoverScale = new THREE.Vector3();
    const originalColor = new THREE.Color();

    // Animation loop
    const animate = () => {
      controls.update();

      if (mouseNeedsCast) {
        mouseNeedsCast = false;

        // Reset previous hover
        if (hoveredMeshUuid !== null && hoveredInstanceId !== null) {
          const prevMesh = txGroup.children.find(
            (c) => c.uuid === hoveredMeshUuid
          ) as THREE.InstancedMesh | undefined;
          if (prevMesh) {
            const height = bucketHeights.get(prevMesh.uuid)!;
            prevMesh.getMatrixAt(hoveredInstanceId, hoverMatrix);
            hoverMatrix.decompose(hoverPos, hoverQuat, hoverScale);
            hoverPos.y = height / 2;
            hoverScale.set(1, 1, 1);
            dummy.position.copy(hoverPos);
            dummy.scale.copy(hoverScale);
            dummy.quaternion.copy(hoverQuat);
            dummy.updateMatrix();
            prevMesh.setMatrixAt(hoveredInstanceId, dummy.matrix);
            prevMesh.instanceMatrix.needsUpdate = true;

            // Restore original bucket color
            const txIdx = instanceToTxIndex.get(prevMesh.uuid)!.get(hoveredInstanceId)!;
            const bucket = blockBytes[txIdx];
            originalColor.setHex(getBucketColor(bucket));
            prevMesh.setColorAt(hoveredInstanceId, originalColor);
            prevMesh.instanceColor!.needsUpdate = true;
          }
          hoveredMeshUuid = null;
          hoveredInstanceId = null;
          hoveredTxIndex = null;
          document.body.style.cursor = "default";
        }

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(txGroup.children);

        // Apply new hover
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const hitMesh = intersects[0].object as THREE.InstancedMesh;
          const instId = intersects[0].instanceId;
          hoveredMeshUuid = hitMesh.uuid;
          hoveredInstanceId = instId;
          hoveredTxIndex = instanceToTxIndex.get(hitMesh.uuid)?.get(instId) ?? null;

          if (!prefersReducedMotion) {
            const height = bucketHeights.get(hitMesh.uuid)!;
            hitMesh.getMatrixAt(instId, hoverMatrix);
            hoverMatrix.decompose(hoverPos, hoverQuat, hoverScale);
            hoverPos.y = height / 2 + 0.5;
            hoverScale.set(1.1, 1.1, 1.1);
            dummy.position.copy(hoverPos);
            dummy.scale.copy(hoverScale);
            dummy.quaternion.copy(hoverQuat);
            dummy.updateMatrix();
            hitMesh.setMatrixAt(instId, dummy.matrix);
            hitMesh.instanceMatrix.needsUpdate = true;
          }

          // Brighten color on hover
          const txIdx = instanceToTxIndex.get(hitMesh.uuid)?.get(instId);
          if (txIdx !== undefined) {
            const bucket = blockBytes[txIdx];
            const hoverColor = new THREE.Color(getBucketColor(bucket));
            hoverColor.multiplyScalar(1.4);
            hitMesh.setColorAt(instId, hoverColor);
            hitMesh.instanceColor!.needsUpdate = true;
          }

          document.body.style.cursor = "pointer";
        }
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // Cleanup
    const domElement = renderer.domElement;
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      domElement.remove();
      txGroup.children.forEach(child => {
        if (child instanceof THREE.InstancedMesh) {
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
