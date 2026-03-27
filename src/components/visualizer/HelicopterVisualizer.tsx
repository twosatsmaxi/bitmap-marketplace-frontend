"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { captureThreeScene } from "@/lib/scorecard";
import { ShareScoreCard } from "@/components/ui/ShareScoreCard";

interface HelicopterVisualizerProps {
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
  previousPositions: Position[];
  direction: { x: number; z: number };
  nextDirection: { x: number; z: number };
  score: number;
  deaths: number;
  bestScore: number;
  speed: number;
  isPlaying: boolean;
  isDead: boolean;
  obstacles: Set<number>;
  eatenBlocks: Set<number>;
  moveProgress: number;
}

const INITIAL_SPEED = 180;
const FOOD_COLOR = 0x88ff00;
const SNAKE_HEAD_COLOR = 0x00ffff;
const SNAKE_BODY_COLOR = 0xf7931a;
const OBSTACLE_COLOR = 0x111111;
const WALL_COLOR = 0x8b4513;
const DEATH_FLASH_MS = 1200;
const OBSTACLE_RATIO = 0.08;
const MAX_VISIBLE_BLOCKS = 500;

// --- Sound effects via Web Audio API ---
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playEatSound(combo: number) {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  // Rising pitch based on combo/streak
  const baseFreq = 440 + Math.min(combo, 20) * 15;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

function playDeathSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  // Low rumble + descending tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
  // Noise burst
  const noise = ctx.createOscillator();
  const noiseGain = ctx.createGain();
  noise.type = "square";
  noise.frequency.setValueAtTime(80, now);
  noiseGain.gain.setValueAtTime(0.08, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.3);
}

function playStartSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  // Quick ascending arpeggio
  [440, 554, 659].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    const t = now + i * 0.1;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

export function HelicopterVisualizer({ blockBytes, blockHeight }: HelicopterVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [snakeLength, setSnakeLength] = useState(1);
  const [deaths, setDeaths] = useState(0);
  const [showStart, setShowStart] = useState(true);
  const [showDeathFlash, setShowDeathFlash] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const gameRef = useRef<GameState>({
    snake: [],
    previousPositions: [],
    direction: { x: 0, z: 0 },
    nextDirection: { x: 1, z: 0 },
    score: 0,
    deaths: 0,
    bestScore: 0,
    speed: INITIAL_SPEED,
    isPlaying: false,
    isDead: false,
    obstacles: new Set(),
    eatenBlocks: new Set(),
    moveProgress: 0,
  });

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const txMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const gridColsRef = useRef(0);
  const visibleCountRef = useRef(0);
  const spacingRef = useRef(2.5);
  const deathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedSceneRef = useRef<string | null>(null);
  const lastDeathStatsRef = useRef<{ score: number; deaths: number; bestScore: number; snakeLength: number } | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const deathFlashRemainingRef = useRef(0);

  // Snake mesh pool
  const snakeMeshPoolRef = useRef<THREE.Mesh[]>([]);
  const snakeGeoRef = useRef<THREE.BoxGeometry | null>(null);
  const snakeHeadMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const snakeBodyMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const headLightRef = useRef<THREE.PointLight | null>(null);

  // Wall meshes
  const wallMeshesRef = useRef<THREE.Mesh[]>([]);

  // Reusable vectors
  const targetPosRef = useRef(new THREE.Vector3());
  const cameraPosRef = useRef(new THREE.Vector3());
  const offsetRef = useRef(new THREE.Vector3(18, 50, 18));

  // Joystick refs
  const joystickRef = useRef<{ active: boolean; dx: number; dz: number }>({ active: false, dx: 0, dz: 0 });
  const joystickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getTxPosition = useCallback((index: number): Position | null => {
    const maxIdx = visibleCountRef.current || blockBytes.length;
    if (index < 0 || index >= maxIdx) return null;
    const cols = gridColsRef.current;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: col - Math.floor(cols / 2),
      z: row - Math.floor(maxIdx / cols / 2),
      index,
    };
  }, [blockBytes.length]);

  const getIndexFromGrid = useCallback((x: number, z: number): number | null => {
    const cols = gridColsRef.current;
    const maxIdx = visibleCountRef.current || blockBytes.length;
    const centerX = Math.floor(cols / 2);
    const centerZ = Math.floor((maxIdx / cols) / 2);
    const col = x + centerX;
    const row = z + centerZ;
    const index = row * cols + col;
    if (index >= 0 && index < maxIdx) return index;
    return null;
  }, [blockBytes.length]);

  // Grow snake mesh pool as needed
  const ensureSnakePool = useCallback((needed: number) => {
    const scene = sceneRef.current;
    const geo = snakeGeoRef.current;
    const mat = snakeBodyMatRef.current;
    if (!scene || !geo || !mat) return;
    while (snakeMeshPoolRef.current.length < needed) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      scene.add(mesh);
      snakeMeshPoolRef.current.push(mesh);
    }
  }, []);

  // Set up blocks as food (green tint) or obstacles (black)
  const setupBlockRoles = useCallback(() => {
    const game = gameRef.current;
    const maxIdx = visibleCountRef.current || blockBytes.length;
    game.obstacles.clear();
    game.eatenBlocks.clear();

    const startPos = getTxPosition(Math.floor(maxIdx / 2));
    const safeX = startPos ? startPos.x : 0;
    const safeZ = startPos ? startPos.z : 0;

    // Collect all non-safe-zone block indices
    const safeIndices: number[] = [];
    const otherIndices: number[] = [];
    for (let i = 0; i < maxIdx; i++) {
      const pos = getTxPosition(i);
      if (!pos) continue;
      if (Math.abs(pos.x - safeX) <= 3 && Math.abs(pos.z - safeZ) <= 3) {
        safeIndices.push(i);
      } else {
        otherIndices.push(i);
      }
    }

    // If more than MAX_VISIBLE_BLOCKS, randomly pick which to keep
    const targetVisible = Math.min(MAX_VISIBLE_BLOCKS, safeIndices.length + otherIndices.length);
    const keepFromOther = Math.max(0, targetVisible - safeIndices.length);

    // Shuffle other indices and pick keepFromOther
    for (let i = otherIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherIndices[i], otherIndices[j]] = [otherIndices[j], otherIndices[i]];
    }
    const keptOther = new Set(otherIndices.slice(0, keepFromOther));
    const hiddenOther = otherIndices.slice(keepFromOther);

    // Hide blocks that weren't selected
    hiddenOther.forEach(i => {
      const mesh = txMeshesRef.current.get(i);
      if (mesh) mesh.visible = false;
    });

    // Tint kept blocks: safe zone = food, others = food or obstacle
    const allKept = [...safeIndices, ...otherIndices.slice(0, keepFromOther)];
    for (const i of allKept) {
      const mesh = txMeshesRef.current.get(i);
      if (!mesh) continue;
      const pos = getTxPosition(i);
      if (!pos) continue;

      const inSafeZone = Math.abs(pos.x - safeX) <= 4 && Math.abs(pos.z - safeZ) <= 4;

      if (!inSafeZone && Math.random() < OBSTACLE_RATIO) {
        // Obstacle — black
        game.obstacles.add(i);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(OBSTACLE_COLOR);
        mat.emissive.setHex(0x440000);
        mat.emissiveIntensity = 1.5;
        mat.opacity = 0.95;
      } else {
        // Food — green
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.setHex(FOOD_COLOR);
        mat.emissive.setHex(FOOD_COLOR);
        mat.emissiveIntensity = 0.4;
        mat.opacity = 0.8;
      }
    }
  }, [blockBytes.length, getTxPosition]);

  // Restore all blocks to original colors when returning to menu
  const restoreBlocks = useCallback(() => {
    const blockColors = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b];
    txMeshesRef.current.forEach((mesh) => {
      mesh.visible = true;
      const ud = (mesh as any).userData;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(ud.originalColor);
      mat.emissive.setHex(ud.originalColor);
      mat.emissiveIntensity = 0.2;
      mat.opacity = 0.7;
    });
  }, []);

  // Handle death → respawn
  const handleDeath = useCallback(() => {
    const game = gameRef.current;
    // Capture scene before death state changes visuals
    capturedSceneRef.current = captureThreeScene(rendererRef.current, sceneRef.current, cameraRef.current);
    lastDeathStatsRef.current = {
      score: game.score,
      deaths: game.deaths + 1,
      bestScore: Math.max(game.score, game.bestScore),
      snakeLength: game.snake.length,
    };
    game.isDead = true;
    game.deaths++;
    if (game.score > game.bestScore) game.bestScore = game.score;
    setDeaths(game.deaths);
    setHighScore(game.bestScore);
    setShowDeathFlash(true);
    playDeathSound();

    if (deathTimerRef.current) clearTimeout(deathTimerRef.current);
    deathFlashRemainingRef.current = DEATH_FLASH_MS;
    const deathStartTime = Date.now();
    deathTimerRef.current = setTimeout(() => {
      deathFlashRemainingRef.current = 0;
      const maxIdx = visibleCountRef.current || blockBytes.length;
      const startIndex = Math.floor(maxIdx / 2);
      const startPos = getTxPosition(startIndex) || { x: 0, z: 0, index: 0 };
      game.snake = [startPos];
      game.previousPositions = [startPos];
      game.direction = { x: 1, z: 0 };
      game.nextDirection = { x: 1, z: 0 };
      game.speed = INITIAL_SPEED;
      game.isDead = false;
      game.moveProgress = 0;
      setShowDeathFlash(false);
      setSnakeLength(1);
    }, DEATH_FLASH_MS);
  }, [blockBytes.length, getTxPosition]);

  const handleShareFromDeathFlash = useCallback(() => {
    // Pause respawn timer
    if (deathTimerRef.current) {
      clearTimeout(deathTimerRef.current);
      deathTimerRef.current = null;
    }
    setShowShareCard(true);
  }, []);

  const handleShareClose = useCallback(() => {
    setShowShareCard(false);
    // Resume respawn immediately
    const game = gameRef.current;
    if (game.isDead) {
      const maxIdx = visibleCountRef.current || blockBytes.length;
      const startIndex = Math.floor(maxIdx / 2);
      const startPos = getTxPosition(startIndex) || { x: 0, z: 0, index: 0 };
      game.snake = [startPos];
      game.previousPositions = [startPos];
      game.direction = { x: 1, z: 0 };
      game.nextDirection = { x: 1, z: 0 };
      game.speed = INITIAL_SPEED;
      game.isDead = false;
      game.moveProgress = 0;
      setShowDeathFlash(false);
      setSnakeLength(1);
    }
  }, [blockBytes.length, getTxPosition]);

  // Joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickOriginRef.current = { x: centerX, y: centerY };
    joystickRef.current.active = true;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxR = rect.width / 2 - 20;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${Math.cos(angle) * clampedDist}px, ${Math.sin(angle) * clampedDist}px)`;
    }
    const norm = Math.min(dist / maxR, 1);
    if (norm > 0.4) {
      const current = gameRef.current.direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && current.x !== -1) gameRef.current.nextDirection = { x: 1, z: 0 };
        else if (dx < 0 && current.x !== 1) gameRef.current.nextDirection = { x: -1, z: 0 };
      } else {
        if (dy > 0 && current.z !== -1) gameRef.current.nextDirection = { x: 0, z: 1 };
        else if (dy < 0 && current.z !== 1) gameRef.current.nextDirection = { x: 0, z: -1 };
      }
    }
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!joystickRef.current.active) return;
    const touch = e.touches[0];
    const origin = joystickOriginRef.current;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const maxR = rect.width / 2 - 20;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${Math.cos(angle) * clampedDist}px, ${Math.sin(angle) * clampedDist}px)`;
    }
    const norm = Math.min(dist / maxR, 1);
    if (norm > 0.4) {
      const current = gameRef.current.direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && current.x !== -1) gameRef.current.nextDirection = { x: 1, z: 0 };
        else if (dx < 0 && current.x !== 1) gameRef.current.nextDirection = { x: -1, z: 0 };
      } else {
        if (dy > 0 && current.z !== -1) gameRef.current.nextDirection = { x: 0, z: 1 };
        else if (dy < 0 && current.z !== 1) gameRef.current.nextDirection = { x: 0, z: -1 };
      }
    }
  }, []);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joystickRef.current.active = false;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, []);

  const startGame = useCallback(() => {
    const maxIdx = visibleCountRef.current || blockBytes.length;
    const startIndex = Math.floor(maxIdx / 2);
    const startPos = getTxPosition(startIndex) || { x: 0, z: 0, index: 0 };

    gameRef.current = {
      snake: [startPos],
      previousPositions: [startPos],
      direction: { x: 1, z: 0 },
      nextDirection: { x: 1, z: 0 },
      score: 0,
      deaths: 0,
      bestScore: 0,
      speed: INITIAL_SPEED,
      isPlaying: true,
      isDead: false,
      obstacles: new Set(),
      eatenBlocks: new Set(),
      moveProgress: 0,
    };

    // Tint blocks as food (green) or obstacles (red), clear some for paths
    setupBlockRoles();

    setScore(0);
    setDeaths(0);
    setHighScore(0);
    setSnakeLength(1);
    setShowDeathFlash(false);
    setShowStart(false);
    playStartSound();
  }, [blockBytes.length, getTxPosition, setupBlockRoles]);

  const resetGame = useCallback(() => {
    gameRef.current.isPlaying = false;
    if (deathTimerRef.current) clearTimeout(deathTimerRef.current);

    // Hide snake meshes
    snakeMeshPoolRef.current.forEach(m => { m.visible = false; });

    // Restore all blocks to original appearance
    restoreBlocks();

    setShowStart(true);
    setShowDeathFlash(false);
  }, [restoreBlocks]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    const txCount = blockBytes.length;
    const visibleCount = Math.min(txCount, 2000);
    visibleCountRef.current = visibleCount;
    const cols = Math.ceil(Math.sqrt(visibleCount));
    gridColsRef.current = cols;
    const spacing = 2.5;
    spacingRef.current = spacing;
    const rows = Math.ceil(visibleCount / cols);

    // Camera
    const camDist = Math.max(cols * spacing * 0.7, 28);
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(camDist * 0.3, camDist * 0.8, camDist * 0.3);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);
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
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // --- Wall borders ---
    const wallHeight = 2.5;
    const wallThickness = spacing * 0.4;
    const halfW = (cols / 2 + 0.6) * spacing;
    const halfH = (rows / 2 + 0.6) * spacing;
    const wallMat = new THREE.MeshStandardMaterial({
      color: WALL_COLOR,
      emissive: WALL_COLOR,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.7,
    });
    const wallConfigs = [
      { w: halfW * 2 + wallThickness, d: wallThickness, px: 0, pz: -halfH },
      { w: halfW * 2 + wallThickness, d: wallThickness, px: 0, pz: halfH },
      { w: wallThickness, d: halfH * 2 + wallThickness, px: -halfW, pz: 0 },
      { w: wallThickness, d: halfH * 2 + wallThickness, px: halfW, pz: 0 },
    ];
    wallConfigs.forEach(({ w, d, px, pz }) => {
      const geo = new THREE.BoxGeometry(w, wallHeight, d);
      const mesh = new THREE.Mesh(geo, wallMat.clone());
      mesh.position.set(px, wallHeight / 2 - 2, pz);
      scene.add(mesh);
      wallMeshesRef.current.push(mesh);
    });

    // Block colors by bucket
    const blockColors = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b];

    // Create transaction blocks
    txMeshesRef.current.clear();

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - Math.floor(rows / 2)) * spacing;

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

      (mesh as any).userData = {
        originalColor: color,
        originalHeight: height / 2 - 2,
        index: i,
        bucket
      };

      scene.add(mesh);
      txMeshesRef.current.set(i, mesh);
    }

    // --- Snake mesh pool setup ---
    const snakeGeo = new THREE.BoxGeometry(spacing * 0.85, 1.8, spacing * 0.85);
    snakeGeoRef.current = snakeGeo;
    const headMat = new THREE.MeshStandardMaterial({
      color: SNAKE_HEAD_COLOR,
      emissive: SNAKE_HEAD_COLOR,
      emissiveIntensity: 1.5,
    });
    snakeHeadMatRef.current = headMat;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: SNAKE_BODY_COLOR,
      emissive: SNAKE_BODY_COLOR,
      emissiveIntensity: 0.8,
    });
    snakeBodyMatRef.current = bodyMat;

    // Head point light
    const headLight = new THREE.PointLight(SNAKE_HEAD_COLOR, 3, 12);
    headLight.position.set(0, 2, 0);
    scene.add(headLight);
    headLightRef.current = headLight;

    // Pre-allocate initial pool of 10
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(snakeGeo, bodyMat.clone());
      mesh.visible = false;
      scene.add(mesh);
      snakeMeshPoolRef.current.push(mesh);
    }

    // Input
    const onKeyDown = (e: KeyboardEvent) => {
      const game = gameRef.current;
      if (!game.isPlaying || game.isDead) {
        if (e.key === "Escape") resetGame();
        return;
      }

      const k = e.key.toLowerCase();
      const current = game.direction;

      if ((k === "arrowup" || k === "w") && current.z !== 1) {
        game.nextDirection = { x: 0, z: -1 };
      } else if ((k === "arrowdown" || k === "s") && current.z !== -1) {
        game.nextDirection = { x: 0, z: 1 };
      } else if ((k === "arrowleft" || k === "a") && current.x !== 1) {
        game.nextDirection = { x: -1, z: 0 };
      } else if ((k === "arrowright" || k === "d") && current.x !== -1) {
        game.nextDirection = { x: 1, z: 0 };
      } else if (k === "escape") {
        resetGame();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Scroll to zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const offset = offsetRef.current;
      const zoomSpeed = 2;
      const delta = e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
      const newY = Math.max(15, Math.min(120, offset.y + delta));
      const scale = newY / offset.y;
      offset.set(offset.x * scale, newY, offset.z * scale);
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    let lastMove = 0;
    let lastTime = 0;

    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = time - lastTime;
      lastTime = time;
      if (delta > 100) return;

      const game = gameRef.current;
      const sp = spacingRef.current;

      // --- Game logic ---
      if (game.isPlaying && !game.isDead) {
        if (time - lastMove > game.speed) {
          lastMove = time;

          // Save previous positions for lerp
          game.previousPositions = game.snake.map(p => ({ ...p }));
          game.moveProgress = 0;

          game.direction = game.nextDirection;
          const head = game.snake[0];
          const newIndex = getIndexFromGrid(head.x + game.direction.x, head.z + game.direction.z);

          // Wall collision
          if (newIndex === null) {
            handleDeath();
          } else {
            const newPos = getTxPosition(newIndex)!;

            // Obstacle collision
            if (game.obstacles.has(newPos.index)) {
              handleDeath();
            } else {
              // Self collision
              let hitSelf = false;
              for (let i = 0; i < game.snake.length; i++) {
                if (game.snake[i].index === newPos.index) {
                  hitSelf = true;
                  break;
                }
              }

              if (hitSelf) {
                handleDeath();
              } else {
                game.snake.unshift(newPos);

                // Food block collision — block is visible and not eaten yet
                const blockMesh = txMeshesRef.current.get(newPos.index);
                const isFood = blockMesh && blockMesh.visible && !game.obstacles.has(newPos.index) && !game.eatenBlocks.has(newPos.index);

                if (isFood) {
                  // Eat the block — hide it, score up, snake grows
                  game.eatenBlocks.add(newPos.index);
                  blockMesh.visible = false;
                  game.score += 10;
                  playEatSound(game.snake.length);
                  requestAnimationFrame(() => {
                    setScore(game.score);
                    setSnakeLength(game.snake.length);
                  });
                  game.speed = Math.max(80, INITIAL_SPEED - game.score * 0.5);
                } else {
                  // Empty cell — just move, don't grow
                  game.snake.pop();
                }
              }
            }
          }
        } else {
          // Update move progress for smooth interpolation
          game.moveProgress = Math.min((time - lastMove) / game.speed, 1);
        }
      }

      // --- Pulse obstacle blocks (dark with red glow) ---
      if (game.isPlaying) {
        game.obstacles.forEach((idx) => {
          const mesh = txMeshesRef.current.get(idx);
          if (mesh && mesh.visible) {
            const pulse = 1 + Math.sin(time * 0.004) * 0.2;
            mesh.scale.set(1, pulse, 1);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + Math.sin(time * 0.006) * 0.5;
          }
        });
      }

      // --- Update dedicated snake meshes ---
      if (game.isPlaying) {
        const len = game.snake.length;
        ensureSnakePool(len);

        // Ease-out for smooth movement
        const t = 1 - Math.pow(1 - game.moveProgress, 2);

        for (let i = 0; i < snakeMeshPoolRef.current.length; i++) {
          const mesh = snakeMeshPoolRef.current[i];
          if (i < len && !game.isDead) {
            mesh.visible = true;
            const curr = game.snake[i];
            const prev = game.previousPositions[i] || curr;

            const lx = prev.x + (curr.x - prev.x) * t;
            const lz = prev.z + (curr.z - prev.z) * t;

            mesh.position.set(lx * sp, 0, lz * sp);

            if (i === 0) {
              mesh.material = snakeHeadMatRef.current!;
              const pulse = 1 + Math.sin(time * 0.008) * 0.12;
              mesh.scale.set(pulse, pulse, pulse);
              if (headLightRef.current) {
                headLightRef.current.position.set(lx * sp, 2, lz * sp);
              }
            } else {
              const bodyMaterial = mesh.material as THREE.MeshStandardMaterial;
              if (bodyMaterial === snakeHeadMatRef.current) {
                mesh.material = snakeBodyMatRef.current!.clone();
              }
              const fade = 1 - (i / Math.max(len, 1)) * 0.6;
              (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 * fade;
              (mesh.material as THREE.MeshStandardMaterial).opacity = 0.95 * fade + 0.3;
              (mesh.material as THREE.MeshStandardMaterial).transparent = true;
              mesh.scale.set(1, 1, 1);
            }
          } else {
            mesh.visible = false;
          }
        }
      } else {
        snakeMeshPoolRef.current.forEach(m => { m.visible = false; });
        if (headLightRef.current) headLightRef.current.intensity = 0;
      }

      // --- Camera follow (interpolated head) ---
      if (game.isPlaying && game.snake.length > 0 && cameraRef.current) {
        const head = game.snake[0];
        const prev = game.previousPositions[0] || head;
        const t2 = 1 - Math.pow(1 - game.moveProgress, 2);
        const lx = prev.x + (head.x - prev.x) * t2;
        const lz = prev.z + (head.z - prev.z) * t2;
        targetPosRef.current.set(lx * sp, 0, lz * sp);
        cameraPosRef.current.copy(targetPosRef.current).add(offsetRef.current);
        cameraRef.current.position.lerp(cameraPosRef.current, 0.06);
      }

      // Update head light
      if (headLightRef.current) {
        headLightRef.current.intensity = game.isPlaying && !game.isDead ? 3 : 0;
      }

      renderer.render(scene, camera);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("wheel", onWheel);
      if (deathTimerRef.current) clearTimeout(deathTimerRef.current);

      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }

      txMeshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      snakeMeshPoolRef.current.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      snakeMeshPoolRef.current = [];
      wallMeshesRef.current.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      wallMeshesRef.current = [];
      if (snakeGeoRef.current) snakeGeoRef.current.dispose();
      if (snakeHeadMatRef.current) snakeHeadMatRef.current.dispose();
      if (snakeBodyMatRef.current) snakeBodyMatRef.current.dispose();
    };
  }, [blockBytes, ensureSnakePool, getIndexFromGrid, getTxPosition, handleDeath, resetGame]);

  return (
    <div className="relative w-full h-full z-0">
      <div ref={containerRef} className="absolute inset-0 z-0" style={{ top: "var(--header-total)" }} />

      {/* Start Screen */}
      {showStart && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
          <div className="text-center">
            <h1 className="font-mono text-4xl font-bold text-primary mb-2">SLITHER</h1>
            <p className="font-mono text-zinc-400 mb-2">on Block {blockHeight.toLocaleString()}</p>
            <p className="font-mono text-sm text-zinc-500 mb-2">{blockBytes.length.toLocaleString()} transactions</p>
            <p className="font-mono text-sm text-zinc-500 mb-2">Eat the green blocks. Avoid the dark ones.</p>
            <p className="font-mono text-sm text-zinc-500 mb-8">
              {isMobile ? 'Use joystick to steer' : 'WASD / Arrows to steer · Scroll to zoom'}
            </p>
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

      {/* Death Flash */}
      {showDeathFlash && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-center animate-pulse">
            <h1 className="font-mono text-5xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(255,0,0,0.6)]">
              YOU DIED
            </h1>
            <p className="font-mono text-lg text-zinc-400 mt-2">Score: {score}</p>
            <button
              onClick={handleShareFromDeathFlash}
              className="mt-3 px-4 py-1.5 bg-zinc-800/80 text-zinc-300 font-mono text-xs font-bold hover:bg-zinc-700 transition-colors pointer-events-auto"
            >
              SHARE
            </button>
          </div>
        </div>
      )}

      {capturedSceneRef.current && lastDeathStatsRef.current && (
        <ShareScoreCard
          isOpen={showShareCard}
          onClose={handleShareClose}
          gameName="SLITHER"
          stats={[
            { label: "Score", value: `${lastDeathStatsRef.current.score}` },
            { label: "Snake Length", value: `${lastDeathStatsRef.current.snakeLength}` },
            { label: "Deaths", value: `${lastDeathStatsRef.current.deaths}` },
            { label: "Best Score", value: `${lastDeathStatsRef.current.bestScore}` },
          ]}
          blockHeight={blockHeight}
          sceneCapture={capturedSceneRef.current}
          isHighScore={lastDeathStatsRef.current.score >= lastDeathStatsRef.current.bestScore && lastDeathStatsRef.current.score > 0}
          tweetText={`Scored ${lastDeathStatsRef.current.score} in SLITHER on Block ${blockHeight.toLocaleString()}! Play at bitmap.game`}
        />
      )}

      {/* Enhanced HUD */}
      {!showStart && (
        <>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
            <div className="br-card px-4 py-2 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500">Block</span>
                <span className="font-mono text-sm font-bold text-zinc-300">{blockHeight.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500">Score</span>
                <span className="font-mono text-sm font-bold text-primary">{score}</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500">Len</span>
                <span className="font-mono text-sm font-bold text-cyan-400">{snakeLength}</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500">Best</span>
                <span className="font-mono text-sm font-bold text-zinc-300">{highScore}</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500">Deaths</span>
                <span className="font-mono text-sm font-bold text-red-400">{deaths}</span>
              </div>
            </div>
          </div>

          {isMobile ? (
            <>
              <div
                ref={joystickContainerRef}
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
                className="absolute bottom-8 left-6 z-20 w-[120px] h-[120px] rounded-full border-2 border-primary/40 bg-bg/30 flex items-center justify-center touch-none"
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
              >
                <div
                  ref={joystickKnobRef}
                  className="w-12 h-12 rounded-full bg-primary/70 border-2 border-primary transition-none pointer-events-none"
                  style={{ willChange: 'transform' }}
                />
              </div>
              <div className="absolute bottom-6 left-[160px] z-10">
                <div className="br-card p-3 bg-bg/80">
                  <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">Controls</div>
                  <div className="font-mono text-xs text-zinc-300 space-y-1">
                    <div>Joystick — Move</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute bottom-6 left-6 z-10">
              <div className="br-card p-3 bg-bg/80">
                <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">Controls</div>
                <div className="font-mono text-xs text-zinc-300 space-y-1">
                  <div>WASD / Arrows — Move</div>
                  <div>Scroll — Zoom</div>
                  <div>ESC — Exit to Menu</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={resetGame}
            className="absolute top-20 left-6 z-10 px-4 py-2 br-card font-mono text-sm text-zinc-400 hover:text-white transition-colors"
          >
            &larr; Exit
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
