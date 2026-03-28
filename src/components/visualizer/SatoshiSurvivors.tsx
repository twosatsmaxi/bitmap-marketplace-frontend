"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { captureThreeScene } from "@/lib/scorecard";
import { ShareScoreCard } from "@/components/ui/ShareScoreCard";

interface SatoshiSurvivorsProps {
  blockBytes: Uint8Array;
  blockHeight: number;
}

interface Enemy {
  index: number;
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  speed: number;
  active: boolean;
  originalX: number;
  originalZ: number;
}

interface GameState {
  score: number;
  level: number;
  xp: number;
  xpToNext: number;
  wave: number;
  gameOver: boolean;
  isPlaying: boolean;
  enemies: Enemy[];
  projectiles: { mesh: THREE.Mesh; dx: number; dz: number; life: number }[];
  pickups: { mesh: THREE.Mesh; x: number; z: number; value: number }[];
  playerPos: { x: number; z: number };
  occupied: Set<number>;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  lastShot: number;
  pendingUpgrades: number;
}

// Simple synth for game sounds
class GameSynth {
  ctx: AudioContext | null = null;
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  shoot() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
  
  collect() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  
  hit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
  
  levelUp() {
    if (!this.ctx) return;
    // Arpeggio chord
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx!.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.5);
      
      osc.start(this.ctx!.currentTime + i * 0.05);
      osc.stop(this.ctx!.currentTime + 0.5);
    });
  }
  
  enemyDie() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
}

const BLOCK_COLORS = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b];
const UPGRADE_NAMES = [
  { name: "DAMAGE UP", icon: "⚡", color: "#ff6b6b", apply: (g: GameState) => g.damage *= 1.4 },
  { name: "FIRE RATE", icon: "🔥", color: "#ff9f43", apply: (g: GameState) => g.fireRate *= 0.8 },
  { name: "BULLET SPEED", icon: "💨", color: "#48dbfb", apply: (g: GameState) => g.projectileSpeed *= 1.25 },
  { name: "MULTI SHOT", icon: "🔫", color: "#1dd1a1", apply: (g: GameState) => { /* handled separately */ } },
];

export function SatoshiSurvivors({ blockBytes, blockHeight }: SatoshiSurvivorsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeAnim, setUpgradeAnim] = useState(false);
  const [lastUpgrade, setLastUpgrade] = useState<string>("");

  const gameRef = useRef<GameState>({
    score: 0, level: 1, xp: 0, xpToNext: 100, wave: 1,
    gameOver: false, isPlaying: false,
    enemies: [], projectiles: [], pickups: [],
    playerPos: { x: 0, z: 0 }, occupied: new Set(),
    damage: 15, fireRate: 350, projectileSpeed: 18,
    lastShot: 0, pendingUpgrades: 0,
  });

  const synthRef = useRef(new GameSynth());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGPURenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const blocksRef = useRef<THREE.Mesh[]>([]);
  const blockInstanceRef = useRef<THREE.InstancedMesh | null>(null);
  const blockDataRef = useRef<{ index: number; color: number; origX: number; origY: number; origZ: number; size: number; height: number }[]>([]);
  const projectilePoolRef = useRef<{ mesh: THREE.Mesh; inUse: boolean }[]>([]);
  const frameIdRef = useRef(0);
  const colsRef = useRef(0);
  const initErrorRef = useRef(false);
  const [initError, setInitError] = useState(false);
  const capturedSceneRef = useRef<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const spacing = 2.5;
  const multiShotRef = useRef(1);

  // Virtual joystick state for mobile
  const joystickRef = useRef<{ active: boolean; dx: number; dz: number }>({ active: false, dx: 0, dz: 0 });
  const joystickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);

  // Camera orbit touch state (for mobile — any touch not on UI)
  const cameraTouchRef = useRef<{
    touchId: number | null; lastX: number; lastY: number;
    startX: number; startY: number; isDragging: boolean;
    velocityX: number; velocityY: number;
  }>({
    touchId: null, lastX: 0, lastY: 0,
    startX: 0, startY: 0, isDragging: false,
    velocityX: 0, velocityY: 0,
  });

  // Detect mobile/touch device
  useEffect(() => {
    const check = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Virtual joystick touch handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickOriginRef.current = { x: centerX, y: centerY };
    joystickRef.current.active = true;

    // Update knob position
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
    joystickRef.current.dx = Math.cos(angle) * norm;
    joystickRef.current.dz = Math.sin(angle) * norm;
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
    joystickRef.current.dx = Math.cos(angle) * norm;
    joystickRef.current.dz = Math.sin(angle) * norm;
  }, []);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joystickRef.current.active = false;
    joystickRef.current.dx = 0;
    joystickRef.current.dz = 0;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, []);

  // Camera orbit touch handlers (mobile — swipe anywhere not on UI)
  const CAMERA_DEAD_ZONE = 3; // px — ignore micro-movements (taps)
  const CAMERA_SENSITIVITY_X = 0.004;
  const CAMERA_SENSITIVITY_Y = 0.0025;
  const CAMERA_INERTIA_DECAY = 0.92;

  const handleCameraStart = useCallback((e: TouchEvent) => {
    if (cameraTouchRef.current.touchId !== null) return;
    if (showUpgrade) return; // lock camera during upgrade selection
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.closest('[data-ui]')) return;
    const cam = cameraTouchRef.current;
    cam.touchId = touch.identifier;
    cam.lastX = touch.clientX;
    cam.lastY = touch.clientY;
    cam.startX = touch.clientX;
    cam.startY = touch.clientY;
    cam.isDragging = false;
    cam.velocityX = 0;
    cam.velocityY = 0;
  }, [showUpgrade]);

  const handleCameraMove = useCallback((e: TouchEvent) => {
    const cam = cameraTouchRef.current;
    if (cam.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== cam.touchId) continue;

      const dx = touch.clientX - cam.lastX;
      const dy = touch.clientY - cam.lastY;

      // Dead zone — only start rotating after exceeding threshold from start
      if (!cam.isDragging) {
        const totalDx = touch.clientX - cam.startX;
        const totalDy = touch.clientY - cam.startY;
        if (Math.abs(totalDx) < CAMERA_DEAD_ZONE && Math.abs(totalDy) < CAMERA_DEAD_ZONE) return;
        cam.isDragging = true;
      }

      // Non-linear sensitivity — slow = precise, fast = big rotation
      const speed = Math.sqrt(dx * dx + dy * dy);
      const curve = Math.min(speed / 10, 2);
      const sx = dx * CAMERA_SENSITIVITY_X * (0.5 + curve * 0.5);
      const sy = dy * CAMERA_SENSITIVITY_Y * (0.5 + curve * 0.5);

      const controls = controlsRef.current;
      if (controls) {
        controls.rotateLeft(sx);
        controls.rotateUp(sy);
      }

      // Track velocity for inertia
      cam.velocityX = sx;
      cam.velocityY = sy;
      cam.lastX = touch.clientX;
      cam.lastY = touch.clientY;
      break;
    }
  }, []);

  const handleCameraEnd = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchRef.current.touchId) {
        cameraTouchRef.current.touchId = null;
        cameraTouchRef.current.isDragging = false;
        // velocityX/Y preserved for inertia in game loop
        break;
      }
    }
  }, []);

  const startGame = useCallback(() => {
    synthRef.current.init();
    
    // Reset individual block meshes and re-sync instanced mesh
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();
    blocksRef.current.forEach((block, i) => {
      const ud = (block as any).userData;
      block.position.set(ud.origX, ud.origY, ud.origZ);
      block.visible = false; // hide individual mesh, instanced mesh shows it
      (block.material as THREE.MeshStandardMaterial).color.setHex(ud.color);
      (block.material as THREE.MeshStandardMaterial).emissive.setHex(ud.color);
      (block.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15;

      // Reset instanced mesh transform
      if (blockInstanceRef.current) {
        dummy.position.set(ud.origX, ud.origY, ud.origZ);
        dummy.scale.set(ud.size, ud.height, ud.size);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        blockInstanceRef.current.setMatrixAt(i, dummy.matrix);
        tmpColor.setHex(ud.color);
        blockInstanceRef.current.setColorAt!(i, tmpColor);
      }
    });
    if (blockInstanceRef.current) {
      blockInstanceRef.current.instanceMatrix.needsUpdate = true;
      if (blockInstanceRef.current.instanceColor) blockInstanceRef.current.instanceColor.needsUpdate = true;
    }

    // Return pooled projectiles
    gameRef.current.projectiles.forEach(p => { p.mesh.visible = false; });
    projectilePoolRef.current.forEach(p => { p.inUse = false; p.mesh.visible = false; });
    gameRef.current.pickups.forEach(p => sceneRef.current?.remove(p.mesh));
    
    multiShotRef.current = 1;
    
    gameRef.current = {
      score: 0, level: 1, xp: 0, xpToNext: 100, wave: 1,
      gameOver: false, isPlaying: true,
      enemies: [], projectiles: [], pickups: [],
      playerPos: { x: 0, z: 0 }, occupied: new Set(),
      damage: 15, fireRate: 350, projectileSpeed: 18,
      lastShot: 0, pendingUpgrades: 0,
    };
    
    setScore(0); setLevel(1); setWave(1);
    setGameOver(false); setShowStart(false); setShowUpgrade(false);
  }, []);

  const applyUpgrade = useCallback((idx: number) => {
    const upgrade = UPGRADE_NAMES[idx];
    upgrade.apply(gameRef.current);
    if (upgrade.name === "MULTI SHOT") multiShotRef.current += 1;
    
    setLastUpgrade(`${upgrade.icon} ${upgrade.name}`);
    setShowUpgrade(false);
    gameRef.current.isPlaying = true;
    gameRef.current.pendingUpgrades--;
    
    // Show upgrade notification
    setUpgradeAnim(true);
    setTimeout(() => setUpgradeAnim(false), 1500);
    
    synthRef.current.levelUp();
    
    // If more upgrades pending, show next
    if (gameRef.current.pendingUpgrades > 0) {
      setTimeout(() => {
        gameRef.current.isPlaying = false;
        setShowUpgrade(true);
      }, 500);
    }
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current.isPlaying = false;
    setShowStart(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let aborted = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    const txCount = blockBytes.length;
    const cols = Math.ceil(Math.sqrt(Math.min(txCount, 2000)));
    colsRef.current = cols;

    const camDist = Math.max(cols * spacing * 0.35, 18);
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, camDist, camDist * 0.7);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, container);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minPolarAngle = Math.PI / 4;
    controls.mouseButtons = { LEFT: undefined, MIDDLE: undefined, RIGHT: undefined };
    controls.zoomSpeed = 1.2;
    // On mobile, disable built-in rotate (we handle it via custom touch handlers) — keep pinch zoom
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    controls.enableRotate = !isTouchDevice;
    if (isTouchDevice) {
      controls.touches = { ONE: THREE.TOUCH.DOLLY_PAN, TWO: THREE.TOUCH.DOLLY_PAN };
      // Custom camera orbit via touch — swipe anywhere not on UI
      container.addEventListener('touchstart', handleCameraStart, { passive: true });
      container.addEventListener('touchmove', handleCameraMove, { passive: true });
      container.addEventListener('touchend', handleCameraEnd, { passive: true });
      container.addEventListener('touchcancel', handleCameraEnd, { passive: true });
    }

    const renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(20, 40, 20);
    scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(cols * spacing * 3, cols * spacing * 3),
      new THREE.MeshLambertMaterial({ color: 0x0a0a0c })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    scene.add(ground);

    const grid = new THREE.GridHelper(cols * spacing * 3, Math.floor(cols * 1.5), 0xf7931a, 0x1a1a1e);
    grid.position.y = -2.99;
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    scene.add(grid);

    // Create transaction blocks using InstancedMesh for performance
    const visible = Math.min(txCount, 2000);
    blocksRef.current = [];
    blockDataRef.current = [];

    // Use a single unit box geometry; per-instance scale handles varying sizes
    const sharedBlockGeo = new THREE.BoxGeometry(1, 1, 1);
    const sharedBlockMat = new THREE.MeshStandardMaterial({
      roughness: 0.5, metalness: 0.3,
    });
    const instancedBlocks = new THREE.InstancedMesh(sharedBlockGeo, sharedBlockMat, visible);
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < visible; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;
      const color = BLOCK_COLORS[bucket - 1] || BLOCK_COLORS[0];
      const size = 0.5 + bucket * 0.25;
      const height = 0.4 + bucket * 0.35;
      const posY = height / 2 - 2.5;

      dummy.position.set(x, posY, z);
      dummy.scale.set(size, height, size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedBlocks.setMatrixAt(i, dummy.matrix);
      tmpColor.setHex(color);
      instancedBlocks.setColorAt!(i, tmpColor);

      blockDataRef.current.push({
        index: i, color, origX: x, origY: posY, origZ: z, size, height,
      });
    }

    instancedBlocks.instanceMatrix.needsUpdate = true;
    if (instancedBlocks.instanceColor) instancedBlocks.instanceColor.needsUpdate = true;
    scene.add(instancedBlocks);
    blockInstanceRef.current = instancedBlocks;

    // We still need individual meshes for blocks that become enemies (they move independently).
    // Create them lazily — blocksRef will hold per-block meshes only when they become enemies.
    // For the enemy system, we create meshes on-demand but reuse them via the existing enemy lifecycle.
    // To keep compatibility with startGame reset and enemy code, pre-create individual meshes as before
    // but DON'T add them to the scene (the instanced mesh handles static rendering).
    for (let i = 0; i < visible; i++) {
      const bd = blockDataRef.current[i];
      const geo = new THREE.BoxGeometry(bd.size, bd.height, bd.size);
      const mat = new THREE.MeshStandardMaterial({
        color: bd.color, emissive: bd.color, emissiveIntensity: 0.15,
        roughness: 0.5, metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bd.origX, bd.origY, bd.origZ);
      mesh.visible = false; // hidden; instanced mesh renders the block
      (mesh as any).userData = {
        index: i, color: bd.color, origX: bd.origX, origY: bd.origY, origZ: bd.origZ,
        origColor: bd.color, size: bd.size, height: bd.height,
      };
      scene.add(mesh);
      blocksRef.current.push(mesh);
    }

    // Pre-create projectile pool (object pooling to avoid per-frame allocations)
    const PROJECTILE_POOL_SIZE = 80;
    const projGeo = new THREE.BoxGeometry(0.22, 0.22, 0.45);
    const projMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b, emissive: 0xffaa00, emissiveIntensity: 1,
    });
    projectilePoolRef.current = [];
    for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(projGeo, projMat);
      mesh.visible = false;
      scene.add(mesh);
      projectilePoolRef.current.push({ mesh, inUse: false });
    }

    // Player gun turret
    const player = new THREE.Group();
    
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    base.position.y = -0.3;
    player.add(base);
    
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 })
    );
    body.position.y = 0.1;
    player.add(body);
    
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.3 
      })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.15, 0.4);
    player.add(barrel);
    
    const muzzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.08, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 0.9 
      })
    );
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.15, 0.75);
    player.add(muzzle);
    
    player.visible = false;
    scene.add(player);
    playerRef.current = player;

    const keys = { w: false, a: false, s: false, d: false };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.w = true;
      if (k === "a" || k === "arrowleft") keys.a = true;
      if (k === "s" || k === "arrowdown") keys.s = true;
      if (k === "d" || k === "arrowright") keys.d = true;
      if (k === "escape") resetGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.w = false;
      if (k === "a" || k === "arrowleft") keys.a = false;
      if (k === "s" || k === "arrowdown") keys.s = false;
      if (k === "d" || k === "arrowright") keys.d = false;
    };
    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

    let lastTime = 0;
    let lastSpawn = 0;

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const game = gameRef.current;
      if (!game.isPlaying || game.gameOver) {
        controls.update();
        renderer.render(scene, camera);
        return;
      }

      // Player movement (keyboard + virtual joystick)
      let mx = 0, mz = 0;
      if (keys.w) mz -= 1;
      if (keys.s) mz += 1;
      if (keys.a) mx -= 1;
      if (keys.d) mx += 1;

      // Add virtual joystick input
      const joy = joystickRef.current;
      if (joy.active) {
        mx += joy.dx;
        mz += joy.dz;
      }

      if (mx !== 0 || mz !== 0) {
        const len = Math.sqrt(mx * mx + mz * mz);
        mx /= len; mz /= len;
        game.playerPos.x += mx * 9 * dt;
        game.playerPos.z += mz * 9 * dt;
        const limit = (cols / 2) * spacing - 1;
        game.playerPos.x = Math.max(-limit, Math.min(limit, game.playerPos.x));
        game.playerPos.z = Math.max(-limit, Math.min(limit, game.playerPos.z));
      }

      // Update player visual
      if (playerRef.current) {
        playerRef.current.visible = true;
        playerRef.current.position.x = game.playerPos.x;
        playerRef.current.position.z = game.playerPos.z;
        
        let nearest: Enemy | null = null;
        let nearDist = Infinity;
        for (const e of game.enemies) {
          if (!e.active) continue;
          const dx = e.mesh.position.x - game.playerPos.x;
          const dz = e.mesh.position.z - game.playerPos.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < nearDist) { nearDist = d; nearest = e; }
        }
        
        if (nearest) {
          const ang = Math.atan2(nearest.mesh.position.x - game.playerPos.x, 
                                nearest.mesh.position.z - game.playerPos.z);
          playerRef.current.rotation.y += (ang - playerRef.current.rotation.y) * 12 * dt;
        }
      }

      controls.target.x += (game.playerPos.x - controls.target.x) * 3 * dt;
      controls.target.z += (game.playerPos.z - controls.target.z) * 3 * dt;

      // Camera inertia — drift after finger lifts, then decay
      const cam = cameraTouchRef.current;
      if (cam.touchId === null && (Math.abs(cam.velocityX) > 0.0001 || Math.abs(cam.velocityY) > 0.0001)) {
        controls.rotateLeft(cam.velocityX);
        controls.rotateUp(cam.velocityY);
        cam.velocityX *= CAMERA_INERTIA_DECAY;
        cam.velocityY *= CAMERA_INERTIA_DECAY;
      }

      controls.update();

      // Skip combat during upgrade selection
      if (showUpgrade) {
        renderer.render(scene, camera);
        return;
      }

      // Spawn enemies
      const spawnRate = Math.max(500, 1800 - game.wave * 150);
      if (time - lastSpawn > spawnRate) {
        lastSpawn = time;
        
        const available: number[] = [];
        for (let i = 0; i < visible; i++) {
          if (game.occupied.has(i)) continue;
          const block = blocksRef.current[i];
          const dx = block.position.x - game.playerPos.x;
          const dz = block.position.z - game.playerPos.z;
          if (Math.sqrt(dx * dx + dz * dz) > 10) available.push(i);
        }
        
        if (available.length > 0) {
          const idx = available[Math.floor(Math.random() * available.length)];
          const block = blocksRef.current[idx];
          const ud = (block as any).userData;

          game.occupied.add(idx);

          // Show individual mesh for this enemy (it moves independently)
          block.visible = true;
          (block.material as THREE.MeshStandardMaterial).color.setHex(0xff3333);
          (block.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
          (block.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7;
          block.position.y = ud.origY + 1;

          // Hide this instance in the instanced mesh by scaling to zero
          if (blockInstanceRef.current) {
            const hideDummy = new THREE.Object3D();
            hideDummy.position.set(ud.origX, ud.origY, ud.origZ);
            hideDummy.scale.set(0, 0, 0);
            hideDummy.updateMatrix();
            blockInstanceRef.current.setMatrixAt(idx, hideDummy.matrix);
            blockInstanceRef.current.instanceMatrix.needsUpdate = true;
          }

          game.enemies.push({
            index: idx, mesh: block,
            hp: 30 + game.wave * 10, maxHp: 30 + game.wave * 10,
            speed: 2.5 + game.wave * 0.2,
            active: true,
            originalX: ud.origX, originalZ: ud.origZ,
          });
          
          if (game.enemies.length % 6 === 0) {
            game.wave++;
            setWave(game.wave);
          }
        }
      }

      // Auto-fire
      if (time - game.lastShot > game.fireRate) {
        game.lastShot = time;
        
        let target: Enemy | null = null;
        let tdist = Infinity;
        for (const e of game.enemies) {
          if (!e.active) continue;
          const dx = e.mesh.position.x - game.playerPos.x;
          const dz = e.mesh.position.z - game.playerPos.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < tdist) { tdist = d; target = e; }
        }
        
        if (target) {
          synthRef.current.shoot();
          
          const ang = Math.atan2(target.mesh.position.x - game.playerPos.x,
                                target.mesh.position.z - game.playerPos.z);
          
          const shots = multiShotRef.current;
          for (let s = 0; s < shots; s++) {
            const spread = shots > 1 ? (s - (shots - 1) / 2) * 0.15 : 0;
            const finalAng = ang + spread;

            // Acquire from pool
            const poolEntry = projectilePoolRef.current.find(p => !p.inUse);
            if (!poolEntry) continue; // pool exhausted, skip
            poolEntry.inUse = true;
            const proj = poolEntry.mesh;
            proj.visible = true;
            proj.position.set(game.playerPos.x, 0, game.playerPos.z);
            proj.rotation.set(0, finalAng, 0);

            game.projectiles.push({
              mesh: proj,
              dx: Math.sin(finalAng) * game.projectileSpeed,
              dz: Math.cos(finalAng) * game.projectileSpeed,
              life: 1.5,
            });
          }
        }
      }

      // Update projectiles
      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const p = game.projectiles[i];
        p.mesh.position.x += p.dx * dt;
        p.mesh.position.z += p.dz * dt;
        p.life -= dt;
        
        let hit = false;
        for (const e of game.enemies) {
          if (!e.active) continue;
          const dx = p.mesh.position.x - e.mesh.position.x;
          const dz = p.mesh.position.z - e.mesh.position.z;
          if (Math.sqrt(dx * dx + dz * dz) < 1) {
            e.hp -= game.damage;
            hit = true;
            
            synthRef.current.hit();
            
            (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
            (e.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
            
            if (e.hp <= 0) {
              e.active = false;
              game.occupied.delete(e.index);
              
              synthRef.current.enemyDie();
              
              const coin = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.35, 0.35),
                new THREE.MeshStandardMaterial({ 
                  color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8 
                })
              );
              coin.position.copy(e.mesh.position);
              coin.position.y = 0;
              scene.add(coin);
              game.pickups.push({ mesh: coin, x: coin.position.x, z: coin.position.z, value: 10 + game.wave * 2 });
              
              game.score += 10 + game.wave * 2;
              game.xp += 8;
              setScore(game.score);
              
              // Level up check - queue upgrades instead of pausing
              if (game.xp >= game.xpToNext) {
                game.xp -= game.xpToNext;
                game.level++;
                game.xpToNext = Math.floor(game.xpToNext * 1.5);
                game.pendingUpgrades++;
                setLevel(game.level);
                
                // Only pause if not already showing upgrade
                if (!showUpgrade && game.pendingUpgrades === 1) {
                  game.isPlaying = false;
                  setShowUpgrade(true);
                }
              }
              
              // Return block — animate individual mesh back, then restore instanced mesh instance
              const capturedEnemy = e;
              setTimeout(() => {
                const startT = Date.now();
                const returnAnim = () => {
                  const elapsed = (Date.now() - startT) / 300;
                  const ud = (capturedEnemy.mesh as any).userData;
                  if (elapsed >= 1) {
                    capturedEnemy.mesh.position.set(capturedEnemy.originalX, ud.origY, capturedEnemy.originalZ);
                    capturedEnemy.mesh.visible = false; // hide individual mesh
                    (capturedEnemy.mesh.material as THREE.MeshStandardMaterial).color.setHex(ud.color);
                    (capturedEnemy.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(ud.color);
                    (capturedEnemy.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15;
                    // Restore instanced mesh instance
                    if (blockInstanceRef.current) {
                      const restoreDummy = new THREE.Object3D();
                      restoreDummy.position.set(ud.origX, ud.origY, ud.origZ);
                      restoreDummy.scale.set(ud.size, ud.height, ud.size);
                      restoreDummy.rotation.set(0, 0, 0);
                      restoreDummy.updateMatrix();
                      blockInstanceRef.current.setMatrixAt(capturedEnemy.index, restoreDummy.matrix);
                      const restoreColor = new THREE.Color(ud.color);
                      blockInstanceRef.current.setColorAt!(capturedEnemy.index, restoreColor);
                      blockInstanceRef.current.instanceMatrix.needsUpdate = true;
                      if (blockInstanceRef.current.instanceColor) blockInstanceRef.current.instanceColor.needsUpdate = true;
                    }
                    return;
                  }
                  capturedEnemy.mesh.position.x += (capturedEnemy.originalX - capturedEnemy.mesh.position.x) * 0.15;
                  capturedEnemy.mesh.position.z += (capturedEnemy.originalZ - capturedEnemy.mesh.position.z) * 0.15;
                  capturedEnemy.mesh.position.y += (ud.origY - capturedEnemy.mesh.position.y) * 0.15;
                  requestAnimationFrame(returnAnim);
                };
                returnAnim();
              }, 50);
            } else {
              setTimeout(() => {
                if (e.active) {
                  (e.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xff3333);
                  (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
                  (e.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7;
                }
              }, 60);
            }
            break;
          }
        }
        
        if (hit || p.life <= 0) {
          // Return projectile to pool
          p.mesh.visible = false;
          const poolEntry = projectilePoolRef.current.find(pe => pe.mesh === p.mesh);
          if (poolEntry) poolEntry.inUse = false;
          game.projectiles.splice(i, 1);
        }
      }

      // Move enemies
      for (const e of game.enemies) {
        if (!e.active) continue;
        
        const dx = game.playerPos.x - e.mesh.position.x;
        const dz = game.playerPos.z - e.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.6) {
          e.mesh.position.x += (dx / dist) * e.speed * dt;
          e.mesh.position.z += (dz / dist) * e.speed * dt;
          e.mesh.position.y = (e.mesh as any).userData.origY + 1 + Math.sin(time * 0.008 + e.index) * 0.3;
          e.mesh.rotation.y += 4 * dt;
          e.mesh.rotation.z = Math.sin(time * 0.01 + e.index) * 0.15;
        } else {
          game.gameOver = true;
          capturedSceneRef.current = captureThreeScene(rendererRef.current, sceneRef.current, cameraRef.current);
          setGameOver(true);
          if (game.score > highScore) setHighScore(game.score);
        }
      }

      // Collect satoshis
      for (let i = game.pickups.length - 1; i >= 0; i--) {
        const p = game.pickups[i];
        const dx = game.playerPos.x - p.x;
        const dz = game.playerPos.z - p.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 4) {
          p.x += dx * 6 * dt;
          p.z += dz * 6 * dt;
          p.mesh.position.x = p.x;
          p.mesh.position.z = p.z;
        }
        p.mesh.rotation.y += 8 * dt;
        
        if (dist < 0.8) {
          scene.remove(p.mesh);
          game.pickups.splice(i, 1);
          game.score += p.value;
          setScore(game.score);
          synthRef.current.collect();
        }
      }

      renderer.render(scene, camera);
    };

    // WebGPURenderer requires async init (falls back to WebGL if WebGPU unavailable)
    renderer.init().then(() => {
      if (!aborted) renderer.setAnimationLoop(animate);
    }).catch(() => {
      // WebGPU and WebGL both failed
      initErrorRef.current = true;
      setInitError(true);
    });

    return () => {
      aborted = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      container.removeEventListener('touchstart', handleCameraStart);
      container.removeEventListener('touchmove', handleCameraMove);
      container.removeEventListener('touchend', handleCameraEnd);
      container.removeEventListener('touchcancel', handleCameraEnd);
      // Dispose all geometries, materials, and textures to prevent GPU memory leaks
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
      if (blockInstanceRef.current) {
        blockInstanceRef.current.geometry.dispose();
        if (Array.isArray(blockInstanceRef.current.material)) blockInstanceRef.current.material.forEach(m => m.dispose());
        else (blockInstanceRef.current.material as THREE.Material).dispose();
        blockInstanceRef.current = null;
      }
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [blockBytes, highScore, resetGame, showUpgrade, handleCameraStart, handleCameraMove, handleCameraEnd]);

  return (
    <div className="relative w-full h-full z-0">
      <div ref={containerRef} className="absolute inset-0 z-0" style={{ top: "var(--header-total)" }} />

      {/* WebGPU/WebGL init error */}
      {initError && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-center space-y-3">
            <h1 className="font-mono text-3xl font-bold text-red-400">Renderer Error</h1>
            <p className="font-mono text-lg text-zinc-300 max-w-md">
              Your browser does not support WebGPU or WebGL. Please try a different browser or device.
            </p>
          </div>
        </div>
      )}

      {/* Upgrade Toast Notification */}
      {upgradeAnim && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <div className="br-card px-6 py-3 bg-primary text-black font-mono font-bold text-lg">
            {lastUpgrade}!
          </div>
        </div>
      )}

      {/* Quick Upgrade Selection - Bottom Overlay */}
      {showUpgrade && (
        <div data-ui className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="font-mono text-2xl font-bold text-black bg-primary px-4 py-2 inline-block">
              LEVEL UP! ({gameRef.current.pendingUpgrades} remaining)
            </h2>
            <div className="flex gap-3 justify-center">
              {UPGRADE_NAMES.slice(0, 3).map((u, i) => (
                <button
                  key={i}
                  onClick={() => applyUpgrade(i)}
                  className="flex-1 max-w-[160px] p-3 min-h-[56px] bg-primary hover:bg-primary/80 transition-all hover:scale-105 active:scale-95"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-1">{u.icon}</div>
                    <div className="font-mono font-bold text-black text-sm">{u.name}</div>
                    <div className="font-mono text-xs text-black/70 mt-1">
                      {u.name === "DAMAGE UP" && "+40% dmg"}
                      {u.name === "FIRE RATE" && "+25% speed"}
                      {u.name === "BULLET SPEED" && "+25% velocity"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="font-mono text-sm text-black bg-primary px-3 py-1 inline-block">
              Tap to upgrade • {isMobile ? 'Use joystick to move' : 'Move with WASD'}
            </p>
          </div>
        </div>
      )}

      {/* Start Screen - Only show when gameOver is false */}
      {showStart && !gameOver && (
        <div data-ui className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <h1 className="font-mono text-5xl font-bold text-black bg-primary px-6 py-3">
              SATOSHI SURVIVORS
            </h1>
            <p className="font-mono text-2xl text-black bg-primary px-4 py-2 inline-block">
              The Blocks Are ALIVE
            </p>
            <br/>
            <p className="font-mono text-lg text-black bg-primary px-3 py-1 inline-block">
              Block {blockHeight.toLocaleString()}
            </p>
            <br/>
            <p className="font-mono text-lg text-black bg-primary px-3 py-1 inline-block">
              🔊 Sound enabled!
            </p>
            <br/>
            <p className="font-mono text-base text-black bg-primary px-3 py-1 inline-block max-w-lg">
              Transaction blocks will rise and chase you
            </p>
            <br/>
            <p className="font-mono text-base text-black bg-primary px-3 py-1 inline-block">
              Destroy them to collect satoshis
            </p>
            <br/>
            <p className="font-mono text-sm text-black bg-primary px-3 py-1 inline-block">
              {isMobile ? '🕹️ Joystick to move • Swipe to look • Pinch to zoom' : '⌨️ WASD to move • Scroll to zoom'}
            </p>
            <br/>
            {highScore > 0 && (
              <p className="font-mono text-lg text-black bg-primary px-4 py-1 inline-block">
                High Score: {highScore}
              </p>
            )}
            <br/>
            <button 
              onClick={startGame} 
              className="mt-4 px-12 py-4 bg-primary text-black font-mono font-bold text-2xl hover:bg-primary/80 transition-colors"
            >
              PLAY
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen - Only show when not in start screen */}
      {gameOver && !showStart && (
        <div data-ui className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <h1 className="font-mono text-5xl font-bold text-black bg-primary px-6 py-3">
              GAME OVER
            </h1>
            <p className="font-mono text-4xl text-black bg-primary px-5 py-2 inline-block">
              {score} sats
            </p>
            <br/>
            <p className="font-mono text-lg text-black bg-primary px-4 py-1 inline-block">
              Level {level} • Wave {wave}
            </p>
            <br/>
            {score === highScore && score > 0 && (
              <p className="font-mono text-xl text-black bg-primary px-4 py-1 inline-block">
                New High Score!
              </p>
            )}
            <br/>
            <div className="flex gap-4 justify-center mt-4">
              <button onClick={startGame} className="px-8 py-4 bg-primary text-black font-mono font-bold text-xl hover:bg-primary/80 transition-colors">
                PLAY AGAIN
              </button>
              <button onClick={() => setShowShareCard(true)} className="px-8 py-4 bg-zinc-800 text-zinc-200 font-mono font-bold text-xl hover:bg-zinc-700 transition-colors">
                SHARE
              </button>
              <button onClick={resetGame} className="px-8 py-4 bg-primary text-black font-mono font-bold text-xl hover:bg-primary/80 transition-colors">
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {capturedSceneRef.current && (
        <ShareScoreCard
          isOpen={showShareCard}
          onClose={() => setShowShareCard(false)}
          gameName="SATOSHI SURVIVORS"
          stats={[
            { label: "Score", value: `${score} sats` },
            { label: "Level", value: `${level}` },
            { label: "Wave", value: `${wave}` },
          ]}
          blockHeight={blockHeight}
          sceneCapture={capturedSceneRef.current}
          isHighScore={score === highScore && score > 0}
          tweetText={`I scored ${score} sats in SATOSHI SURVIVORS on Block ${blockHeight.toLocaleString()}! Play at bitmap.trade/play`}
        />
      )}

      {!showStart && !gameOver && (
        <>
          <div data-ui className="absolute top-16 md:top-20 right-3 md:right-6 z-10 flex gap-1.5 md:gap-2">
            <div className="br-card px-2 md:px-3 py-1.5 md:py-2">
              <span className="font-mono text-[10px] md:text-xs text-zinc-500">LVL</span>
              <span className="font-mono text-lg md:text-xl font-bold text-primary ml-1">{level}</span>
            </div>
            <div className="br-card px-2.5 md:px-4 py-1.5 md:py-2">
              <span className="font-mono text-lg md:text-2xl font-bold text-primary">{score}</span>
              <span className="font-mono text-[10px] md:text-xs text-zinc-500 ml-1">sats</span>
            </div>
          </div>
          <div data-ui className="absolute top-16 md:top-20 left-3 md:left-6 z-10">
            <div className="br-card px-2 md:px-3 py-1.5 md:py-2">
              <span className="font-mono text-[10px] md:text-xs text-zinc-500">WAVE</span>
              <span className="font-mono text-lg md:text-xl font-bold text-red-400 ml-1">{wave}</span>
            </div>
          </div>
          {/* Desktop controls hint */}
          {!isMobile && (
            <div className="absolute bottom-4 md:bottom-6 left-3 md:left-6 z-10 hidden sm:block">
              <div className="br-card p-2.5 md:p-3 bg-bg/80">
                <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">Controls</div>
                <div className="font-mono text-xs text-zinc-300 space-y-1">
                  <div>WASD — Move</div>
                  <div>Mouse wheel — Zoom</div>
                </div>
              </div>
            </div>
          )}
          {/* Mobile virtual joystick */}
          {isMobile && (
            <div
              ref={joystickContainerRef}
              data-ui
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              className="absolute bottom-8 left-6 z-20 w-[120px] h-[120px] rounded-full border-2 border-primary/40 bg-bg/30 flex items-center justify-center touch-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
            >
              <div
                ref={joystickKnobRef}
                className="w-12 h-12 rounded-full bg-primary/70 border-2 border-primary transition-none pointer-events-none"
                style={{ willChange: 'transform' }}
              />
            </div>
          )}
          {!showUpgrade && (
            <button data-ui onClick={resetGame} className="absolute bottom-4 md:bottom-6 right-3 md:right-6 z-10 px-3 md:px-4 py-1.5 md:py-2 br-card font-mono text-xs md:text-sm text-zinc-400 hover:text-white">← Exit</button>
          )}
        </>
      )}
    </div>
  );
}
