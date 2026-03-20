"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface BlockSnakeGameProps {
  blockBytes: Uint8Array;
  blockHeight: number;
}

interface Position {
  x: number;
  z: number;
  index: number;
}

interface GameState {
  snake: Position[];
  food: Position | null;
  direction: { x: number; z: number };
  nextDirection: { x: number; z: number };
  score: number;
  gameOver: boolean;
  speed: number;
  isPlaying: boolean;
}

const INITIAL_SPEED = 180;
const FOOD_COLOR = 0xffd700;
const SNAKE_HEAD_COLOR = 0x00ffff;
const SNAKE_BODY_COLOR = 0x0088ff;

export function BlockSnakeGame({ blockBytes, blockHeight }: BlockSnakeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);

  // Game state in ref to avoid re-renders
  const gameRef = useRef<GameState>({
    snake: [],
    food: null,
    direction: { x: 0, z: 0 },
    nextDirection: { x: 1, z: 0 },
    score: 0,
    gameOver: false,
    speed: INITIAL_SPEED,
    isPlaying: false,
  });

  // Three.js refs - persistent across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const frameIdRef = useRef<number>(0);
  const txMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const foodMeshRef = useRef<THREE.Mesh | null>(null);
  const gridColsRef = useRef(0);
  const spacingRef = useRef(2.5);
  
  // Reusable objects to avoid garbage collection
  const targetPosRef = useRef(new THREE.Vector3());
  const cameraPosRef = useRef(new THREE.Vector3());
  const offsetRef = useRef(new THREE.Vector3(0, 35, 0.1));

  // Calculate grid position from index
  const getTxPosition = useCallback((index: number): Position | null => {
    if (index < 0 || index >= blockBytes.length) return null;
    const cols = gridColsRef.current;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: col - Math.floor(cols / 2),
      z: row - Math.floor(blockBytes.length / cols / 2),
      index,
    };
  }, [blockBytes.length]);

  // Calculate index from grid coordinates
  const getIndexFromGrid = useCallback((x: number, z: number): number | null => {
    const cols = gridColsRef.current;
    const centerX = Math.floor(cols / 2);
    const centerZ = Math.floor((blockBytes.length / cols) / 2);
    const col = x + centerX;
    const row = z + centerZ;
    const index = row * cols + col;
    if (index >= 0 && index < blockBytes.length) return index;
    return null;
  }, [blockBytes.length]);

  // Spawn food on a random unoccupied transaction
  const spawnFood = useCallback((): Position | null => {
    const occupied = new Set(gameRef.current.snake.map(s => s.index));
    const validIndices: number[] = [];
    for (let i = 0; i < blockBytes.length; i++) {
      if (!occupied.has(i)) validIndices.push(i);
    }
    if (validIndices.length === 0) return null;
    const idx = validIndices[Math.floor(Math.random() * validIndices.length)];
    return getTxPosition(idx);
  }, [blockBytes.length, getTxPosition]);

  // Start game
  const startGame = useCallback(() => {
    const startIndex = Math.floor(blockBytes.length / 2);
    const startPos = getTxPosition(startIndex) || { x: 0, z: 0, index: 0 };
    
    gameRef.current = {
      snake: [startPos],
      food: spawnFood(),
      direction: { x: 1, z: 0 },
      nextDirection: { x: 1, z: 0 },
      score: 0,
      gameOver: false,
      speed: INITIAL_SPEED,
      isPlaying: true,
    };
    
    setScore(0);
    setGameOver(false);
    setShowStart(false);
  }, [blockBytes.length, getTxPosition, spawnFood]);

  // Reset to menu
  const resetGame = useCallback(() => {
    gameRef.current.isPlaying = false;
    setShowStart(true);
    setGameOver(false);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    // Calculate grid
    const txCount = blockBytes.length;
    const cols = Math.ceil(Math.sqrt(Math.min(txCount, 2000)));
    gridColsRef.current = cols;
    const spacing = 2.5;
    spacingRef.current = spacing;

    // Camera - top-down view for snake game
    const camDist = Math.max(cols * spacing * 0.8, 30);
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, camDist, 0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Ground
    const groundSize = cols * spacing * 2;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      new THREE.MeshLambertMaterial({ color: 0x121214, transparent: true, opacity: 0.6 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(groundSize, Math.min(cols * 2, 100), 0xf7931a, 0x27272a);
    gridHelper.position.y = -1.99;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Block colors by bucket
    const blockColors = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b];

    // Create transaction blocks
    const visibleCount = Math.min(txCount, 2000);
    txMeshesRef.current.clear();

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      const size = 0.4 + bucket * 0.3;
      const color = blockColors[bucket - 1] || blockColors[0];
      const height = 0.3 + bucket * 0.4;

      const geometry = new THREE.BoxGeometry(size, height, size);
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        emissive: color,
        emissiveIntensity: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, height / 2 - 2, z);
      
      // Store original data
      (mesh as any).userData = { 
        originalColor: color, 
        originalHeight: height / 2 - 2,
        index: i,
        bucket 
      };
      
      scene.add(mesh);
      txMeshesRef.current.set(i, mesh);
    }

    // Food mesh - positioned on top of blocks
    const foodGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const foodMat = new THREE.MeshStandardMaterial({
      color: FOOD_COLOR,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
    });
    const foodMesh = new THREE.Mesh(foodGeo, foodMat);
    foodMesh.visible = false;
    scene.add(foodMesh);
    foodMeshRef.current = foodMesh;

    // Input
    const onKeyDown = (e: KeyboardEvent) => {
      if (!gameRef.current.isPlaying || gameRef.current.gameOver) {
        if (e.key === "Escape") resetGame();
        return;
      }

      const k = e.key.toLowerCase();
      const current = gameRef.current.direction;

      if ((k === "arrowup" || k === "w") && current.z !== 1) {
        gameRef.current.nextDirection = { x: 0, z: -1 };
      } else if ((k === "arrowdown" || k === "s") && current.z !== -1) {
        gameRef.current.nextDirection = { x: 0, z: 1 };
      } else if ((k === "arrowleft" || k === "a") && current.x !== 1) {
        gameRef.current.nextDirection = { x: -1, z: 0 };
      } else if ((k === "arrowright" || k === "d") && current.x !== -1) {
        gameRef.current.nextDirection = { x: 1, z: 0 };
      } else if (k === "escape") {
        resetGame();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Resize
    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation
    let lastMove = 0;
    let lastTime = 0;

    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const delta = time - lastTime;
      lastTime = time;

      if (delta > 100) return; // Skip large deltas (tab switch, etc)

      const game = gameRef.current;
      const spacing = spacingRef.current;

      // Game logic
      if (game.isPlaying && !game.gameOver) {
        if (time - lastMove > game.speed) {
          lastMove = time;
          game.direction = game.nextDirection;

          const head = game.snake[0];
          const newIndex = getIndexFromGrid(head.x + game.direction.x, head.z + game.direction.z);

          // Wall collision
          if (newIndex === null) {
            game.gameOver = true;
            setGameOver(true);
            if (game.score > highScore) setHighScore(game.score);
          } else {
            const newPos = getTxPosition(newIndex)!;

            // Self collision
            let hitSelf = false;
            for (let i = 0; i < game.snake.length; i++) {
              if (game.snake[i].index === newPos.index) {
                hitSelf = true;
                break;
              }
            }

            if (hitSelf) {
              game.gameOver = true;
              setGameOver(true);
              if (game.score > highScore) setHighScore(game.score);
            } else {
              game.snake.unshift(newPos);

              // Food collision
              if (game.food && newPos.index === game.food.index) {
                game.score += 10;
                // Batch state updates
                requestAnimationFrame(() => setScore(game.score));
                game.speed = Math.max(80, INITIAL_SPEED - game.score * 1.5);
                game.food = spawnFood();
              } else {
                game.snake.pop();
              }
            }
          }
        }
      }

      // Update block visuals
      txMeshesRef.current.forEach((mesh) => {
        const userData = (mesh as any).userData;
        const isHead = game.snake[0]?.index === userData.index;
        const isBody = game.snake.slice(1).some(s => s.index === userData.index);
        const isFood = game.food?.index === userData.index;

        if (isHead) {
          const pulse = 1 + Math.sin(time * 0.01) * 0.1;
          mesh.scale.setScalar(1.4 * pulse);
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(SNAKE_HEAD_COLOR);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;
        } else if (isBody) {
          mesh.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.2);
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(SNAKE_BODY_COLOR);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        } else if (isFood) {
          const pulse = 1 + Math.sin(time * 0.005) * 0.15;
          mesh.scale.setScalar(pulse);
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(FOOD_COLOR);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
        } else {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(userData.originalColor);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        }
      });

      // Update food mesh - positioned on top of the block
      if (foodMeshRef.current && game.food && game.isPlaying) {
        const foodPos = getTxPosition(game.food.index);
        if (foodPos) {
          const foodBlock = txMeshesRef.current.get(game.food.index);
          const blockTop = foodBlock ? (foodBlock as any).userData.originalHeight + 0.3 : -1;
          
          foodMeshRef.current.visible = true;
          foodMeshRef.current.position.x = foodPos.x * spacing;
          foodMeshRef.current.position.y = blockTop + Math.sin(time * 0.008) * 0.15;
          foodMeshRef.current.position.z = foodPos.z * spacing;
          foodMeshRef.current.rotation.y += 0.02;
        }
      } else if (foodMeshRef.current) {
        foodMeshRef.current.visible = false;
      }

      // Camera follow snake
      if (game.isPlaying && game.snake.length > 0 && cameraRef.current) {
        const head = game.snake[0];
        targetPosRef.current.set(head.x * spacing, 0, head.z * spacing);
        cameraPosRef.current.copy(targetPosRef.current).add(offsetRef.current);
        
        cameraRef.current.position.lerp(cameraPosRef.current, 0.04);
        cameraRef.current.lookAt(targetPosRef.current);
      }

      renderer.render(scene, camera);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Cleanup geometries/materials
      txMeshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      if (foodMeshRef.current) {
        foodMeshRef.current.geometry.dispose();
        (foodMeshRef.current.material as THREE.Material).dispose();
      }
    };
  }, [blockBytes, getIndexFromGrid, getTxPosition, highScore, resetGame, spawnFood]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" style={{ top: "var(--header-total)" }} />

      {/* Start Screen */}
      {showStart && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
          <div className="text-center">
            <h1 className="font-mono text-4xl font-bold text-primary mb-2">SNAKE</h1>
            <p className="font-mono text-zinc-400 mb-2">on Block {blockHeight.toLocaleString()}</p>
            <p className="font-mono text-sm text-zinc-500 mb-2">{blockBytes.length.toLocaleString()} transactions</p>
            <p className="font-mono text-sm text-zinc-500 mb-8">Slither through the block. Collect satoshis.</p>
            {highScore > 0 && (
              <p className="font-mono text-sm text-zinc-400 mb-4">High Score: {highScore}</p>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-black font-mono font-bold rounded hover:bg-primary/80 transition-colors"
            >
              PLAY
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
          <div className="text-center">
            <h1 className="font-mono text-4xl font-bold text-red-500 mb-4">GAME OVER</h1>
            <p className="font-mono text-2xl text-white mb-2">Score: {score}</p>
            {score === highScore && score > 0 && (
              <p className="font-mono text-sm text-primary mb-6">New High Score!</p>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-primary text-black font-mono font-bold rounded hover:bg-primary/80 transition-colors"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-zinc-800 text-zinc-300 font-mono font-bold rounded hover:bg-zinc-700 transition-colors"
              >
                BACK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      {!showStart && !gameOver && (
        <>
          <div className="absolute top-20 right-6 z-10">
            <div className="br-card px-4 py-2">
              <span className="font-mono text-2xl font-bold text-primary">{score}</span>
              <span className="font-mono text-xs text-zinc-500 ml-2">sats</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-10">
            <div className="br-card p-3 bg-bg/80">
              <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">Controls</div>
              <div className="font-mono text-xs text-zinc-300 space-y-1">
                <div>WASD / Arrows — Move</div>
                <div>ESC — Exit to Menu</div>
              </div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="absolute top-20 left-6 z-10 px-4 py-2 br-card font-mono text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Exit
          </button>
        </>
      )}

      {/* Legend - only in menu */}
      {showStart && (
        <div className="absolute right-6 z-10" style={{ top: "calc(var(--header-total) + 1rem)" }}>
          <div className="br-card p-3">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
              Output Value
            </div>
            <div className="space-y-1.5">
              {[
                { label: "10+ BTC", color: "#ffeb3b" },
                { label: "1 – 10 BTC", color: "#ffc12a" },
                { label: "0.1 – 1 BTC", color: "#f7931a" },
                { label: "0.01 – 0.1", color: "#b87326" },
                { label: "0.001 – 0.01", color: "#a05a1a" },
                { label: "< 0.001", color: "#7e4912" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[10px] text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
