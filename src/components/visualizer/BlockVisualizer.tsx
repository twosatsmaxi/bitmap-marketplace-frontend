"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface BlockVisualizerProps {
  /** 1 byte per tx — values 1-6 (log₁₀ output value buckets) */
  blockBytes: Uint8Array;
  onTransactionClick?: (index: number) => void;
  /** When true, enables memory match game mode */
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

/** Symbols for matching (1-6) */
const BUCKET_SYMBOLS = ["1", "2", "3", "4", "5", "6"];

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
    
    // Reset all cubes to hidden state
    if (txGroupRef.current && gameMode === "memory") {
      txGroupRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh && !mesh.userData.isDisabled) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color.setHex(HIDDEN_COLOR);
          material.emissive.setHex(HIDDEN_EMISSIVE);
          material.emissiveIntensity = 0.1;
          mesh.userData.isRevealed = false;
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
      const bucket = currentBlockBytes[index];
      const targetColor = getBucketColor(bucket);
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
          material.color.setHex(targetColor);
          material.emissive.setHex(targetColor);
          material.emissiveIntensity = 0.4;
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
      const firstBucket = currentBlockBytes[first];
      const secondBucket = currentBlockBytes[second];
      
      if (firstBucket === secondBucket) {
        // Match!
        setTimeout(() => {
          game.matchedCards.add(first);
          game.matchedCards.add(second);
          game.flippedCards = [];
          
          const currentMatches = matchesRef.current;
          const newMatches = currentMatches + 1;
          setMatches(newMatches);
          
          // Show match animation
          setMatchAnimation({ active: true, bucket: firstBucket });
          setTimeout(() => setMatchAnimation({ active: false, bucket: 0 }), 1000);
          
          // Check for game over
          const totalPairs = Math.floor(currentBlockBytes.length / 2);
          if (newMatches >= totalPairs) {
            const finalTime = Math.floor((Date.now() - game.startTime) / 1000);
            const finalScore = calculateScore(newMoves, finalTime, totalPairs);
            setScore(finalScore);
            setTimeElapsed(finalTime);
            setGameOver(true);
            game.isPlaying = false;
            
            if (finalScore > highScoreRef.current) {
              setHighScore(finalScore);
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
                  mat.color.setHex(HIDDEN_COLOR);
                  mat.emissive.setHex(HIDDEN_EMISSIVE);
                  mat.emissiveIntensity = 0.1;
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
    const gridSpan = cols * 2.5;
    const camDist = Math.max(gridSpan * 0.6, 25);
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(camDist, camDist * 0.7, camDist);
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
    const spacing = 2.5;
    
    // For memory mode, check if odd number
    const isOddCount = gameMode === "memory" && txCount % 2 === 1;
    const disabledIndex = isOddCount ? txCount - 1 : -1;

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      const size = getBucketSize(bucket);
      const color = getBucketColor(bucket);
      const height = 0.3 + bucket * 0.4;
      
      const isDisabled = i === disabledIndex;
      
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

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

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
            (mesh.material as THREE.MeshStandardMaterial).opacity = 0.9;
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
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
          hitMesh.scale.setScalar(1.1);
          if (!hitMesh.userData.isRevealed) {
            (hitMesh.material as THREE.MeshStandardMaterial).opacity = 1;
            (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
          }
          container.style.cursor = "pointer";
        }
      }
      
      // Update timer in memory mode
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
          {/* Match Animation */}
          {matchAnimation.active && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div className="flex flex-col items-center">
                <div 
                  className="w-20 h-20 rounded-lg flex items-center justify-center mb-2 shadow-2xl animate-bounce"
                  style={{ 
                    backgroundColor: `#${getBucketColor(matchAnimation.bucket).toString(16).padStart(6, "0")}`,
                    boxShadow: '0 0 30px rgba(247, 147, 26, 0.8)'
                  }}
                >
                  <span className="text-black font-bold text-3xl">{BUCKET_SYMBOLS[matchAnimation.bucket - 1]}</span>
                </div>
                <div className="px-6 py-2 bg-primary text-black font-mono font-bold text-xl rounded">
                  MATCH!
                </div>
              </div>
            </div>
          )}
          
          {/* Start Screen */}
          {showStartScreen && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/95 z-50 pointer-events-none" style={{ top: "var(--header-total)" }}>
              <div className="text-center max-w-md px-6 pointer-events-auto">
                <h1 className="font-mono text-4xl font-bold text-primary mb-4">MEMORY MATCH</h1>
                
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
                    >
                      <span className="text-black font-bold text-2xl">{BUCKET_SYMBOLS[2]}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">Revealed</span>
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 rounded-lg p-4 mb-6">
                  <p className="font-mono text-sm text-zinc-300 mb-2">
                    <span className="text-primary font-bold">1.</span> Click cubes to reveal
                  </p>
                  <p className="font-mono text-sm text-zinc-300 mb-2">
                    <span className="text-primary font-bold">2.</span> Find two with same number
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
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/95 z-50 pointer-events-none" style={{ top: "var(--header-total)" }}>
              <div className="text-center pointer-events-auto">
                <h1 className="font-mono text-4xl font-bold text-primary mb-4">COMPLETE!</h1>
                <p className="font-mono text-2xl text-white mb-2">Score: {score}</p>
                <p className="font-mono text-sm text-zinc-400 mb-2">Time: {formatTime(timeElapsed)}</p>
                <p className="font-mono text-sm text-zinc-400 mb-6">Moves: {moves}</p>
                {score === highScore && score > 0 && (
                  <p className="font-mono text-sm text-primary mb-6">New High Score!</p>
                )}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-primary text-black font-mono font-bold rounded hover:bg-primary/80 transition-colors pointer-events-auto"
                  >
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* HUD */}
          {!showStartScreen && !gameOver && (
            <>
              <div className="absolute top-20 right-6 z-10 flex gap-2 pointer-events-none">
                <div className="br-card px-3 py-2">
                  <span className="font-mono text-xs text-zinc-500 block">TIME</span>
                  <span className="font-mono text-xl font-bold text-white">{formatTime(timeElapsed)}</span>
                </div>
                <div className="br-card px-3 py-2">
                  <span className="font-mono text-xs text-zinc-500 block">MOVES</span>
                  <span className="font-mono text-xl font-bold text-primary">{moves}</span>
                </div>
              </div>
              
            </>
          )}
        </>
      )}
    </>
  );
}
