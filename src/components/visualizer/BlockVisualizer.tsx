"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { captureThreeScene } from "@/lib/scorecard";
import { ShareScoreCard } from "@/components/ui/ShareScoreCard";

interface BlockVisualizerProps {
  /** 1 byte per tx — values 1-6 (log₁₀ output value buckets) */
  blockBytes: Uint8Array;
  onTransactionClick?: (index: number) => void;
  /** When true, enables Bit Recall game mode */
  gameMode?: "visualize" | "memory";
  blockHeight?: number;
  onGameStateChange?: (state: { isPlaying: boolean; isGameOver: boolean; matches: number; moves: number }) => void;
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

/** Hidden color for memory game */
const HIDDEN_COLOR = 0x27272a;
const HIDDEN_EMISSIVE = 0x111111;

/** Distinct colors for memory game pairs */
const MEMORY_PAIR_COLORS = [
  0xff4444, // red
  0x44aaff, // blue
  0x44ff44, // green
  0xffaa00, // orange
  0xff44ff, // magenta
  0xffff44, // yellow
  0x44ffff, // cyan
  0xff8844, // coral
  0xaa44ff, // purple
  0x88ff88, // light green
];

/** Symbols for memory game pairs */
const MEMORY_PAIR_SYMBOLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

/** Create a CanvasTexture with a letter on a colored background for cube face */
function createLabelTexture(letter: string, bgColor: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background color
  const hex = "#" + bgColor.toString(16).padStart(6, "0");
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);

  // Letter — rotated to tilt toward the camera's default viewing angle
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-Math.PI / 4); // 45 degrees counterclockwise
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 80px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.fillText(letter, 0, 0);
  // Double-stroke for stronger contrast
  ctx.shadowBlur = 0;
  ctx.fillText(letter, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Generate shuffled pair assignments for memory game */
function generatePairAssignments(count: number): number[] {
  const pairs = Math.floor(count / 2);
  const assignments: number[] = [];
  for (let i = 0; i < pairs; i++) {
    assignments.push(i, i); // each pair ID appears twice
  }
  // If odd count, add a -1 for the disabled card
  if (count % 2 === 1) assignments.push(-1);
  // Fisher-Yates shuffle
  for (let i = assignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [assignments[i], assignments[j]] = [assignments[j], assignments[i]];
  }
  return assignments;
}


export function BlockVisualizer({ 
  blockBytes, 
  onTransactionClick, 
  gameMode = "visualize",
  blockHeight = 0,
  onGameStateChange
}: BlockVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(gameMode === "memory");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [matchAnimation, setMatchAnimation] = useState<{ active: boolean; bucket: number }>({ active: false, bucket: 0 });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<{ baseScore: number; movePenalty: number; timeBonus: number; stars: number } | null>(null);

  // Game state refs
  const gameStateRef = useRef({
    isPlaying: false,
    flippedCards: [] as number[],
    matchedCards: new Set<number>(),
    startTime: 0,
  });
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const txGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const frameIdRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const originalColorsRef = useRef<Map<number, number>>(new Map());
  const pairAssignmentsRef = useRef<number[]>([]);
  const capturedSceneRef = useRef<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  // Store mutable values in refs to avoid stale closures
  const gameModeRef = useRef(gameMode);
  const gameOverRef = useRef(gameOver);
  const blockBytesRef = useRef(blockBytes);
  const onTransactionClickRef = useRef(onTransactionClick);
  const movesRef = useRef(moves);
  const matchesRef = useRef(matches);
  const highScoreRef = useRef(highScore);
  const blockHeightRef = useRef(blockHeight);
  const onGameStateChangeRef = useRef(onGameStateChange);
  
  // Store click handler in a mutable object that survives re-renders
  const clickHandlerRef = useRef<{ fn: ((index: number) => void) | null }>({ fn: null });

  // Sync start screen state when gameMode changes (handles React reuse)
  useEffect(() => {
    if (gameMode === "memory") {
      setShowStartScreen(true);
      setGameOver(false);
      setMoves(0);
      setMatches(0);
      setScore(0);
      setTimeElapsed(0);
      gameStateRef.current = {
        isPlaying: false,
        flippedCards: [],
        matchedCards: new Set(),
        startTime: 0,
      };
    }
  }, [gameMode]);

  // Load high score
  useEffect(() => {
    if (gameMode === "memory" && blockHeight > 0) {
      const saved = localStorage.getItem(`memory_highScore_${blockHeight}`);
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, [gameMode, blockHeight]);

  // Calculate score
  const calculateScore = useCallback((moves: number, timeSeconds: number, totalPairs: number): number => {
    const baseScore = totalPairs * 100;
    const movePenalty = Math.max(0, (moves - totalPairs) * 10);
    const timeBonus = Math.max(0, 300 - timeSeconds) * 2;
    return Math.max(0, baseScore - movePenalty + timeBonus);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    gameStateRef.current = {
      isPlaying: true,
      flippedCards: [],
      matchedCards: new Set(),
      startTime: Date.now(),
    };
    setShowStartScreen(false);
    setGameOver(false);
    setMoves(0);
    setMatches(0);
    setScore(0);
    setTimeElapsed(0);
    setMatchAnimation({ active: false, bucket: 0 });
    setIsNewHighScore(false);
    setScoreBreakdown(null);

    // Reset all cubes to hidden state and regenerate pair assignments
    if (txGroupRef.current && gameMode === "memory") {
      const count = txGroupRef.current.children.length;
      pairAssignmentsRef.current = generatePairAssignments(count);
      txGroupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const isDisabled = pairAssignmentsRef.current[i] === -1;
        mesh.userData.isDisabled = isDisabled;
        if (mesh && !isDisabled) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color.setHex(HIDDEN_COLOR);
          material.emissive.setHex(HIDDEN_EMISSIVE);
          material.emissiveIntensity = 0.1;
          material.opacity = 0.9;
          mesh.userData.isRevealed = false;
          material.needsUpdate = true;
        } else if (isDisabled) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = 0.3;
        }
      });
    }
    
    onGameStateChange?.({ isPlaying: true, isGameOver: false, matches: 0, moves: 0 });
  }, [gameMode, onGameStateChange]);

  // Update refs when props/state change
  useEffect(() => {
    gameModeRef.current = gameMode;
    gameOverRef.current = gameOver;
    blockBytesRef.current = blockBytes;
    onTransactionClickRef.current = onTransactionClick;
    movesRef.current = moves;
    matchesRef.current = matches;
    highScoreRef.current = highScore;
    blockHeightRef.current = blockHeight;
    onGameStateChangeRef.current = onGameStateChange;
  }, [gameMode, gameOver, blockBytes, onTransactionClick, moves, matches, highScore, blockHeight, onGameStateChange]);
  
  // Handle cube click in memory mode - uses refs to avoid stale closure
  const handleCubeClick = useCallback((index: number) => {
    const currentGameMode = gameModeRef.current;
    const currentGameOver = gameOverRef.current;
    const currentBlockBytes = blockBytesRef.current;
    const currentOnTransactionClick = onTransactionClickRef.current;
    
    if (currentGameMode !== "memory") {
      currentOnTransactionClick?.(index);
      return;
    }
    
    const game = gameStateRef.current;
    if (!game.isPlaying || currentGameOver) return;
    
    // Check if already flipped or matched
    if (game.flippedCards.includes(index) || game.matchedCards.has(index)) return;
    
    // Check if disabled (odd one out)
    const mesh = txGroupRef.current?.children[index] as THREE.Mesh;
    if (mesh?.userData.isDisabled) return;
    
    // Max 2 cards flipped
    if (game.flippedCards.length >= 2) return;
    
    // Flip the card
    game.flippedCards.push(index);
    
    // Animate reveal
    if (mesh) {
      const pairId = pairAssignmentsRef.current[index];
      const targetColor = MEMORY_PAIR_COLORS[pairId % MEMORY_PAIR_COLORS.length];
      const pairLabel = MEMORY_PAIR_SYMBOLS[pairId % MEMORY_PAIR_SYMBOLS.length];
      const material = mesh.material as THREE.MeshStandardMaterial;
      
      // Animate scale up and color change
      const startScale = mesh.scale.x;
      const startTime = Date.now();
      const duration = 250;
      
      const animateReveal = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Scale bounce
        const scale = startScale + 0.15 * Math.sin(progress * Math.PI);
        mesh.scale.setScalar(scale);

        if (progress >= 0.3 && !mesh.userData.isRevealed) {
          mesh.userData.isRevealed = true;
          // Apply CanvasTexture with letter to front-facing side, color to other faces
          const labelTexture = createLabelTexture(pairLabel, targetColor);
          const sideMat = new THREE.MeshStandardMaterial({
            color: targetColor,
            emissive: targetColor,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9,
            roughness: 0.4,
            metalness: 0.3,
          });
          const faceMat = new THREE.MeshStandardMaterial({
            map: labelTexture,
            emissive: targetColor,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9,
            roughness: 0.3,
            metalness: 0.2,
          });
          // BoxGeometry face order: +x, -x, +y (top), -y (bottom), +z, -z
          // Put label on top face (+y), texture is rotated to face camera
          mesh.userData.originalMaterial = material;
          mesh.material = [sideMat, sideMat, faceMat, sideMat, sideMat, sideMat];
        }

        if (progress < 1) {
          requestAnimationFrame(animateReveal);
        }
      };
      animateReveal();
    }
    
    // Check for match when 2 cards flipped
    if (game.flippedCards.length === 2) {
      const currentMoves = movesRef.current;
      const newMoves = currentMoves + 1;
      setMoves(newMoves);
      
      const [first, second] = game.flippedCards;
      const firstPair = pairAssignmentsRef.current[first];
      const secondPair = pairAssignmentsRef.current[second];

      if (firstPair === secondPair) {
        // Match!
        setTimeout(() => {
          game.matchedCards.add(first);
          game.matchedCards.add(second);
          game.flippedCards = [];

          const currentMatches = matchesRef.current;
          const newMatches = currentMatches + 1;
          setMatches(newMatches);

          // Animate matched cubes with bounce + scale pulse
          [first, second].forEach(idx => {
            const m = txGroupRef.current?.children[idx] as THREE.Mesh;
            if (m) {
              const startTime = Date.now();
              const duration = 600;
              const baseY = m.userData.originalY;
              const animateMatch = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                m.position.y = baseY + 0.5 * Math.sin(progress * Math.PI);
                m.scale.setScalar(1 + 0.15 * Math.sin(progress * Math.PI));
                if (progress < 1) {
                  requestAnimationFrame(animateMatch);
                } else {
                  m.position.y = baseY;
                  m.scale.setScalar(1);
                }
              };
              animateMatch();
            }
          });

          // Show subtle HUD notification
          setMatchAnimation({ active: true, bucket: firstPair });
          setTimeout(() => setMatchAnimation({ active: false, bucket: 0 }), 1200);
          
          // Check for game over
          const totalPairs = Math.floor(currentBlockBytes.length / 2);
          if (newMatches >= totalPairs) {
            const finalTime = Math.floor((Date.now() - game.startTime) / 1000);
            const finalScore = calculateScore(newMoves, finalTime, totalPairs);
            const baseScore = totalPairs * 100;
            const movePenalty = Math.max(0, (newMoves - totalPairs) * 10);
            const timeBonus = Math.max(0, 300 - finalTime) * 2;
            const stars = newMoves <= totalPairs * 2 ? 3 : newMoves <= totalPairs * 3 ? 2 : 1;
            setScoreBreakdown({ baseScore, movePenalty, timeBonus, stars });
            setScore(finalScore);
            setTimeElapsed(finalTime);
            capturedSceneRef.current = captureThreeScene(rendererRef.current, sceneRef.current, cameraRef.current);
            setGameOver(true);
            game.isPlaying = false;
            
            if (finalScore > highScoreRef.current) {
              setHighScore(finalScore);
              setIsNewHighScore(true);
              localStorage.setItem(`memory_highScore_${blockHeightRef.current}`, finalScore.toString());
            }
            
            onGameStateChangeRef.current?.({ isPlaying: false, isGameOver: true, matches: newMatches, moves: newMoves });
          } else {
            onGameStateChangeRef.current?.({ isPlaying: true, isGameOver: false, matches: newMatches, moves: newMoves });
          }
        }, 400);
      } else {
        // No match - flip back
        setTimeout(() => {
          [first, second].forEach(idx => {
            const m = txGroupRef.current?.children[idx] as THREE.Mesh;
            if (m) {
              const mat = m.material as THREE.MeshStandardMaterial;
              const startScale = m.scale.x;
              const startTime = Date.now();
              const duration = 250;
              
              const animateHide = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const scale = 1 + 0.15 * Math.sin((1 - progress) * Math.PI);
                m.scale.setScalar(scale);
                
                if (progress >= 0.5 && m.userData.isRevealed) {
                  m.userData.isRevealed = false;
                  // Restore original single material
                  if (m.userData.originalMaterial) {
                    if (Array.isArray(m.material)) {
                      m.material.forEach((mt: THREE.Material) => {
                        if ((mt as THREE.MeshStandardMaterial).map) {
                          (mt as THREE.MeshStandardMaterial).map!.dispose();
                        }
                        mt.dispose();
                      });
                    }
                    m.material = m.userData.originalMaterial;
                  }
                  const singleMat = m.material as THREE.MeshStandardMaterial;
                  singleMat.color.setHex(HIDDEN_COLOR);
                  singleMat.emissive.setHex(HIDDEN_EMISSIVE);
                  singleMat.emissiveIntensity = 0.1;
                  singleMat.needsUpdate = true;
                }

                if (progress < 1) {
                  requestAnimationFrame(animateHide);
                } else {
                  m.scale.setScalar(1);
                }
              };
              animateHide();
            }
          });
          
          game.flippedCards = [];
        }, 800);
      }
    }
  }, [gameMode, moves, matches, blockBytes, calculateScore, blockHeight, highScore, gameOver, onTransactionClick, onGameStateChange]);
  
  // Update click handler ref
  useEffect(() => {
    clickHandlerRef.current.fn = handleCubeClick;
  }, [handleCubeClick]);
  
  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize scene
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
    sceneRef.current = scene;

    // Camera
    const txCount = blockBytes.length;
    const cols = Math.ceil(Math.sqrt(Math.min(txCount, 2000)));
    const gridSpan = cols * (gameMode === "memory" ? 3.0 : 2.5);
    const camDist = Math.max(gridSpan * 0.6, 25);
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    // Memory mode: tilted top-down for card visibility with quirky angle
    if (gameMode === "memory") {
      camera.position.set(camDist * 0.4, camDist * 1.1, camDist * 0.6);
    } else {
      camera.position.set(camDist, camDist * 0.7, camDist);
    }
    cameraRef.current = camera;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
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
    controlsRef.current = controls;

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

    // Transaction cubes
    const txGroup = new THREE.Group();
    scene.add(txGroup);
    txGroupRef.current = txGroup;

    const visibleCount = Math.min(txCount, 2000);
    const spacing = gameMode === "memory" ? 3.0 : 2.5;

    // For memory mode, generate shuffled pair assignments
    let pairAssignments: number[] = [];
    if (gameMode === "memory") {
      pairAssignments = generatePairAssignments(visibleCount);
      pairAssignmentsRef.current = pairAssignments;
    }

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      // In memory mode: uniform size for fair gameplay and bigger click targets
      const size = gameMode === "memory" ? 2.0 : getBucketSize(bucket);
      const color = getBucketColor(bucket);
      const height = gameMode === "memory" ? 1.5 : 0.3 + bucket * 0.4;

      const isDisabled = gameMode === "memory" && pairAssignments[i] === -1;

      // Store original color
      originalColorsRef.current.set(i, color);

      const geometry = new THREE.BoxGeometry(size, height, size);
      const material = new THREE.MeshStandardMaterial({
        color: gameMode === "memory" && !isDisabled ? HIDDEN_COLOR : color,
        transparent: true,
        opacity: isDisabled ? 0.3 : 0.9,
        emissive: gameMode === "memory" && !isDisabled ? HIDDEN_EMISSIVE : color,
        emissiveIntensity: gameMode === "memory" && !isDisabled ? 0.1 : 0.3,
        roughness: 0.4,
        metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(x, height / 2, z);
      mesh.name = String(i);
      mesh.userData = {
        index: i,
        bucket,
        originalY: height / 2,
        isDisabled,
        isRevealed: false
      };
      mesh.castShadow = !isDisabled;
      mesh.receiveShadow = true;

      txGroup.add(mesh);
    }

    // Interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = () => {
      if (hoveredMeshRef.current && clickHandlerRef.current.fn) {
        const index = parseInt(hoveredMeshRef.current.name, 10);
        clickHandlerRef.current.fn(index);
      }
    };

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    // Touch handling for mobile
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // only single-finger taps
      touchStartTime = Date.now();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const elapsed = Date.now() - touchStartTime;
      if (elapsed > 300) return; // too long, was a gesture

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.sqrt(dx * dx + dy * dy) > 10) return; // too much movement, was a drag

      // It's a tap — run raycaster at tap position
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(txGroup.children);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const isDisabled = hitMesh.userData.isDisabled;
        if (!isDisabled && clickHandlerRef.current.fn) {
          // Brief visual feedback
          hitMesh.position.y = hitMesh.userData.originalY + 0.3;
          hitMesh.scale.setScalar(1.1);
          setTimeout(() => {
            const game = gameStateRef.current;
            const isMatched = game.matchedCards.has(hitMesh.userData.index);
            if (!isMatched) {
              hitMesh.position.y = hitMesh.userData.originalY;
              hitMesh.scale.setScalar(1);
            }
          }, 200);

          const index = parseInt(hitMesh.name, 10);
          clickHandlerRef.current.fn(index);
        }
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Animation loop
    let disposed = false;
    const animate = () => {
      if (disposed) return;
      controls.update();

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(txGroup.children);

      // Reset previous hover
      if (hoveredMeshRef.current) {
        const mesh = hoveredMeshRef.current;
        const game = gameStateRef.current;
        const isFlipped = game.flippedCards.includes(mesh.userData.index);
        const isMatched = game.matchedCards.has(mesh.userData.index);
        
        if (!isFlipped && !isMatched) {
          mesh.position.y = mesh.userData.originalY;
          mesh.scale.setScalar(1);
          if (!mesh.userData.isRevealed) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.opacity = 0.9;
              mat.emissiveIntensity = 0.1;
              if (gameMode === "memory" && mat.emissive) {
                mat.emissive.setHex(HIDDEN_EMISSIVE);
              }
            }
          }
        }
        hoveredMeshRef.current = null;
        container.style.cursor = "default";
      }

      // Apply hover effect
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const game = gameStateRef.current;
        const isFlipped = game.flippedCards.includes(hitMesh.userData.index);
        const isMatched = game.matchedCards.has(hitMesh.userData.index);
        const isDisabled = hitMesh.userData.isDisabled;
        
        // Check if hoverable: in memory mode must be playing, in visualize mode always
        const canHover = gameMode === "memory" ? (game.isPlaying && !isFlipped && !isMatched && !isDisabled) : true;
        
        if (canHover) {
          hoveredMeshRef.current = hitMesh;
          hitMesh.position.y = hitMesh.userData.originalY + 0.5;
          hitMesh.scale.setScalar(1.15);
          if (!hitMesh.userData.isRevealed) {
            const mat = hitMesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.opacity = 1;
              mat.emissiveIntensity = gameMode === "memory" ? 0.6 : 0.3;
              if (gameMode === "memory" && mat.emissive) {
                mat.emissive.setHex(0xf7931a);
              }
            }
          }
          container.style.cursor = "pointer";
        }
      }
      
      // Update timer and label positions in memory mode
      if (gameMode === "memory" && gameStateRef.current.isPlaying && !gameOver) {
        const elapsed = Math.floor((Date.now() - gameStateRef.current.startTime) / 1000);
        setTimeElapsed(elapsed);
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    const domElement = renderer.domElement;
    return () => {
      disposed = true;
      cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      controls.dispose();
      renderer.dispose();
      domElement.remove();
    };
  // Only recreate scene when blockBytes or gameMode changes (not on game state changes)
  }, [blockBytes, gameMode]);

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

  return (
    <>
      {/* 3D Canvas - always at bottom */}
      <div ref={containerRef} className="absolute inset-0 z-0" style={{ top: "var(--header-total)", cursor: "grab" }} />
      
      {/* Memory Game UI Overlay */}
      {gameMode === "memory" && (
        <>
          {/* Match Animation - subtle HUD notification */}
          {matchAnimation.active && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div
                className="px-6 py-2.5 bg-primary/90 text-black font-mono font-bold text-2xl rounded animate-bounce"
                style={{ textShadow: '0 0 12px rgba(255,255,255,0.7), 0 0 24px rgba(255,200,0,0.5)', boxShadow: '0 0 16px rgba(255,200,0,0.4)' }}
              >
                MATCH!
              </div>
            </div>
          )}
          
          {/* Start Screen */}
          {showStartScreen && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg z-50 pointer-events-none" style={{ top: "var(--header-total)" }}>
              <div className="text-center max-w-md px-6 pointer-events-auto">
                <h1 className="font-mono text-4xl font-bold text-primary mb-4">BIT RECALL</h1>
                
                {/* Visual examples */}
                <div className="flex justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mb-2">
                      <span className="text-zinc-500 text-xl">?</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">Hidden</span>
                  </div>
                  <div className="flex items-center text-zinc-600">→</div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded border-2 flex items-center justify-center mb-2"
                      style={{
                        backgroundColor: `#${getBucketColor(3).toString(16).padStart(6, "0")}`,
                        borderColor: `#${getBucketColor(3).toString(16).padStart(6, "0")}`
                      }}
                    />
                    <span className="font-mono text-[10px] text-zinc-500">Revealed</span>
                  </div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4 mb-6">
                  <p className="font-mono text-sm text-zinc-300 mb-2">
                    <span className="text-primary font-bold">1.</span> Tap cubes to reveal their color
                  </p>
                  <p className="font-mono text-sm text-zinc-300 mb-2">
                    <span className="text-primary font-bold">2.</span> Find two cubes with the same color
                  </p>
                  <p className="font-mono text-sm text-zinc-300">
                    <span className="text-primary font-bold">3.</span> Match all pairs to win
                  </p>
                </div>
                
                <p className="font-mono text-xs text-zinc-600 mb-4">
                  {Math.floor(blockBytes.length / 2)} pairs to match
                </p>
                
                {highScore > 0 && (
                  <p className="font-mono text-sm text-zinc-400 mb-4">High Score: {highScore}</p>
                )}
                <button
                  onClick={startGame}
                  className="px-10 py-4 bg-primary text-black font-mono font-bold text-lg rounded hover:bg-primary/80 transition-colors pointer-events-auto"
                >
                  PLAY
                </button>
              </div>
            </div>
          )}
          
          {/* Game Over Screen */}
          {gameOver && scoreBreakdown && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/95 z-50 pointer-events-none" style={{ top: "var(--header-total)" }}>
              <div className="text-center pointer-events-auto max-w-sm w-full mx-4">
                {isNewHighScore && (
                  <div className="mb-4 animate-bounce">
                    <p className="font-mono text-lg font-bold text-primary animate-pulse" style={{ textShadow: "0 0 20px rgba(247,147,26,0.6), 0 0 40px rgba(247,147,26,0.3), 0 0 60px rgba(247,147,26,0.15)" }}>
                      NEW HIGH SCORE!
                    </p>
                  </div>
                )}

                <h1 className="font-mono text-4xl font-bold text-primary mb-3">COMPLETE!</h1>

                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`text-3xl transition-all duration-500 ${i <= scoreBreakdown.stars ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}
                      style={i <= scoreBreakdown.stars ? {
                        filter: "drop-shadow(0 0 6px rgba(247,147,26,0.5))",
                        animationDelay: `${i * 150}ms`,
                      } : undefined}
                    >
                      {i <= scoreBreakdown.stars ? "\u2605" : "\u2606"}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-xs text-zinc-500 mb-5">
                  {scoreBreakdown.stars === 3 ? "Perfect memory!" : scoreBreakdown.stars === 2 ? "Great recall!" : "Good effort!"}
                </p>

                <p className="font-mono text-3xl font-bold text-white mb-5" style={isNewHighScore ? { textShadow: "0 0 12px rgba(247,147,26,0.4)" } : undefined}>
                  {score}
                </p>

                <div className="br-card p-4 mb-5 text-left">
                  <div className="flex justify-between font-mono text-sm mb-2">
                    <span className="text-zinc-400">Base ({Math.floor(blockBytes.length / 2)} pairs)</span>
                    <span className="text-white">+{scoreBreakdown.baseScore}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm mb-2">
                    <span className="text-zinc-400">Move penalty ({moves} moves)</span>
                    <span className={scoreBreakdown.movePenalty > 0 ? "text-red-400" : "text-zinc-500"}>{scoreBreakdown.movePenalty > 0 ? `-${scoreBreakdown.movePenalty}` : "0"}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm mb-2">
                    <span className="text-zinc-400">Time bonus ({formatTime(timeElapsed)})</span>
                    <span className={scoreBreakdown.timeBonus > 0 ? "text-green-400" : "text-zinc-500"}>+{scoreBreakdown.timeBonus}</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between font-mono text-sm font-bold">
                    <span className="text-zinc-300">Total</span>
                    <span className="text-primary">{score}</span>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-primary text-black font-mono font-bold rounded hover:bg-primary/80 transition-colors pointer-events-auto"
                  >
                    PLAY AGAIN
                  </button>
                  <button
                    onClick={() => setShowShareCard(true)}
                    className="px-6 py-3 bg-zinc-800 text-zinc-200 font-mono font-bold rounded hover:bg-zinc-700 transition-colors pointer-events-auto"
                  >
                    SHARE
                  </button>
                </div>
              </div>
            </div>
          )}

          {capturedSceneRef.current && (
            <ShareScoreCard
              isOpen={showShareCard}
              onClose={() => setShowShareCard(false)}
              gameName="BIT RECALL"
              stats={[
                { label: "Score", value: `${score}` },
                { label: "Time", value: formatTime(timeElapsed) },
                { label: "Moves", value: `${moves}` },
              ]}
              blockHeight={blockHeight ?? 0}
              sceneCapture={capturedSceneRef.current}
              isHighScore={isNewHighScore}
              tweetText={`Completed BIT RECALL on Block ${(blockHeight ?? 0).toLocaleString()} with ${score} points! Play at bitmap.trade/play?bitmap=${blockHeight ?? 0}`}
            />
          )}
          
          {/* HUD */}
          {!showStartScreen && !gameOver && (
            <>
              <div className="absolute top-16 md:top-20 right-3 md:right-6 z-10 flex gap-1.5 md:gap-2 pointer-events-none">
                {blockHeight > 0 && (
                  <div className="br-card px-2 md:px-3 py-1.5 md:py-2 opacity-60">
                    <span className="font-mono text-[10px] md:text-xs text-zinc-500 block">BLOCK</span>
                    <span className="font-mono text-base md:text-xl font-bold text-zinc-400">{blockHeight.toLocaleString()}<span className="text-zinc-600">.bitmap</span></span>
                  </div>
                )}
                <div className="br-card px-2 md:px-3 py-1.5 md:py-2">
                  <span className="font-mono text-[10px] md:text-xs text-zinc-500 block">TIME</span>
                  <span className="font-mono text-base md:text-xl font-bold text-white">{formatTime(timeElapsed)}</span>
                </div>
                <div className="br-card px-2 md:px-3 py-1.5 md:py-2">
                  <span className="font-mono text-[10px] md:text-xs text-zinc-500 block">MOVES</span>
                  <span className="font-mono text-base md:text-xl font-bold text-primary">{moves}</span>
                </div>
                <div className="br-card px-2 md:px-3 py-1.5 md:py-2">
                  <span className="font-mono text-[10px] md:text-xs text-zinc-500 block">PAIRS</span>
                  <span className="font-mono text-base md:text-xl font-bold text-white">{matches}/{Math.floor(blockBytes.length / 2)}</span>
                </div>
              </div>

            </>
          )}
        </>
      )}
    </>
  );
}
