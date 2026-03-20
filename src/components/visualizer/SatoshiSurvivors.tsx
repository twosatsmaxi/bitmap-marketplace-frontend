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

interface Enemy {
  id: number;
  x: number;
  z: number;
  index: number; // Which transaction block this enemy is
  mesh: THREE.Mesh;
  originalY: number;
  hp: number;
  maxHp: number;
  speed: number;
  isActive: boolean;
}

interface Projectile {
  id: number;
  x: number;
  z: number;
  dx: number;
  dz: number;
  mesh: THREE.Mesh;
  damage: number;
  life: number;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (stats: GameStats) => void;
}

interface GameStats {
  damage: number;
  fireRate: number;
  projectileCount: number;
  projectileSpeed: number;
  areaSize: number;
  magnetRange: number;
}

interface GameState {
  playerPos: Position;
  enemies: Enemy[];
  projectiles: Projectile[];
  satoshis: { x: number; z: number; index: number; value: number; mesh: THREE.Mesh }[];
  score: number;
  level: number;
  xp: number;
  xpToNext: number;
  gameOver: boolean;
  isPlaying: boolean;
  wave: number;
  stats: GameStats;
  occupiedBlocks: Set<number>; // Which block indices are currently enemies
}

const UPGRADES: Upgrade[] = [
  {
    id: "multishot",
    name: "Multi Shot",
    description: "Fire 2 additional projectiles",
    icon: "🔫",
    apply: (s) => { s.projectileCount += 2; },
  },
  {
    id: "damage",
    name: "Power Up",
    description: "+50% damage",
    icon: "⚡",
    apply: (s) => { s.damage *= 1.5; },
  },
  {
    id: "firerate",
    name: "Rapid Fire",
    description: "+30% attack speed",
    icon: "🔥",
    apply: (s) => { s.fireRate *= 0.7; },
  },
  {
    id: "speed",
    name: "Quick Shot",
    description: "Faster projectiles",
    icon: "💨",
    apply: (s) => { s.projectileSpeed *= 1.4; },
  },
  {
    id: "area",
    name: "Chain Lightning",
    description: "Projectiles chain to nearby enemies",
    icon: "⚡",
    apply: (s) => { s.areaSize *= 1.5; },
  },
  {
    id: "magnet",
    name: "Magnet",
    description: "Larger coin pickup range",
    icon: "🧲",
    apply: (s) => { s.magnetRange *= 1.5; },
  },
];

const ENEMY_COLOR = 0xff3333;
const PLAYER_COLOR = 0x00ff88;

export function SatoshiSurvivors({ blockBytes, blockHeight }: BlockSnakeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);

  const gameRef = useRef<GameState>({
    playerPos: { x: 0, z: 0, index: 0 },
    enemies: [],
    projectiles: [],
    satoshis: [],
    score: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    gameOver: false,
    isPlaying: false,
    wave: 1,
    stats: {
      damage: 10,
      fireRate: 400,
      projectileCount: 1,
      projectileSpeed: 15,
      areaSize: 2,
      magnetRange: 3,
    },
    occupiedBlocks: new Set(),
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const txMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const playerMeshRef = useRef<THREE.Mesh | null>(null);
  const gridColsRef = useRef(0);
  const spacingRef = useRef(2.5);
  const lastShotRef = useRef(0);
  const enemyIdCounter = useRef(0);
  const projectileIdCounter = useRef(0);

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

  const selectUpgrades = useCallback(() => {
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const applyUpgrade = useCallback((upgrade: Upgrade) => {
    upgrade.apply(gameRef.current.stats);
    setShowUpgrade(false);
    gameRef.current.isPlaying = true;
  }, []);

  const resetBlockToNormal = useCallback((enemy: Enemy) => {
    const mesh = enemy.mesh;
    const userData = (mesh as any).userData;
    
    // Restore original appearance
    (mesh.material as THREE.MeshStandardMaterial).color.setHex(userData.originalColor);
    (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(userData.originalColor);
    (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
    
    // Animate back to grid position
    const spacing = spacingRef.current;
    const targetX = enemy.x;
    const targetZ = enemy.z;
    const targetY = userData.originalHeight;
    
    // Smooth return animation
    const startTime = Date.now();
    const duration = 300;
    const startX = mesh.position.x;
    const startY = mesh.position.y;
    const startZ = mesh.position.z;
    
    const animateReturn = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      mesh.position.x = startX + (targetX - startX) * ease;
      mesh.position.y = startY + (targetY - startY) * ease;
      mesh.position.z = startZ + (targetZ - startZ) * ease;
      mesh.scale.setScalar(1 - ease * 0.2);
      
      if (progress < 1) {
        requestAnimationFrame(animateReturn);
      } else {
        mesh.position.set(targetX, targetY, targetZ);
        mesh.scale.set(1, 1, 1);
      }
    };
    animateReturn();
    
    gameRef.current.occupiedBlocks.delete(enemy.index);
  }, []);

  const startGame = useCallback(() => {
    const startIndex = Math.floor(blockBytes.length / 2);
    const startPos = getTxPosition(startIndex) || { x: 0, z: 0, index: 0 };
    
    // Clear any previous enemies
    gameRef.current.enemies.forEach(e => {
      if (e.isActive) resetBlockToNormal(e);
    });
    
    gameRef.current = {
      playerPos: startPos,
      enemies: [],
      projectiles: [],
      satoshis: [],
      score: 0,
      level: 1,
      xp: 0,
      xpToNext: 100,
      gameOver: false,
      isPlaying: true,
      wave: 1,
      stats: {
        damage: 10,
        fireRate: 400,
        projectileCount: 1,
        projectileSpeed: 15,
        areaSize: 2,
        magnetRange: 3,
      },
      occupiedBlocks: new Set(),
    };
    
    setScore(0);
    setLevel(1);
    setWave(1);
    setGameOver(false);
    setShowStart(false);
    setShowUpgrade(false);
    lastShotRef.current = 0;
    enemyIdCounter.current = 0;
    projectileIdCounter.current = 0;
  }, [blockBytes.length, getTxPosition, resetBlockToNormal]);

  const resetGame = useCallback(() => {
    // Return all enemies to normal
    gameRef.current.enemies.forEach(e => {
      if (e.isActive) resetBlockToNormal(e);
    });
    
    // Clear projectiles
    gameRef.current.projectiles.forEach(p => {
      if (sceneRef.current) sceneRef.current.remove(p.mesh);
    });
    
    // Clear satoshis
    gameRef.current.satoshis.forEach(s => {
      if (sceneRef.current) sceneRef.current.remove(s.mesh);
    });
    
    gameRef.current.enemies = [];
    gameRef.current.projectiles = [];
    gameRef.current.satoshis = [];
    gameRef.current.isPlaying = false;
    
    setShowStart(true);
    setGameOver(false);
    setShowUpgrade(false);
  }, [resetBlockToNormal]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    const txCount = blockBytes.length;
    const cols = Math.ceil(Math.sqrt(Math.min(txCount, 2000)));
    gridColsRef.current = cols;
    const spacing = 2.5;
    spacingRef.current = spacing;

    const camDist = Math.max(cols * spacing * 0.4, 20);
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, camDist, camDist);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const groundSize = cols * spacing * 2;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      new THREE.MeshLambertMaterial({ color: 0x121214, transparent: true, opacity: 0.6 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(groundSize, Math.min(cols * 2, 100), 0xf7931a, 0x27272a);
    gridHelper.position.y = -1.99;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Create transaction blocks - these will become enemies!
    const visibleCount = Math.min(txCount, 2000);
    txMeshesRef.current.clear();

    for (let i = 0; i < visibleCount; i++) {
      const bucket = blockBytes[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2) * spacing;
      const z = (row - cols / 2) * spacing;

      const size = 0.4 + bucket * 0.3;
      const color = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b][bucket - 1] || 0x7e4912;
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
        isEnemy: false,
      };
      scene.add(mesh);
      txMeshesRef.current.set(i, mesh);
    }

    // Player gun turret
    const playerGroup = new THREE.Group();
    
    // Base platform
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.2;
    playerGroup.add(base);
    
    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    playerGroup.add(body);
    
    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: PLAYER_COLOR,
      emissive: PLAYER_COLOR,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.25, 0.5);
    playerGroup.add(barrel);
    
    // Barrel tip glow
    const tipGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 8);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 0.25, 0.9);
    playerGroup.add(tip);
    
    // Side grips
    const gripGeo = new THREE.BoxGeometry(0.1, 0.3, 0.2);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.5,
      roughness: 0.6,
    });
    const leftGrip = new THREE.Mesh(gripGeo, gripMat);
    leftGrip.position.set(-0.35, 0.1, 0);
    playerGroup.add(leftGrip);
    
    const rightGrip = new THREE.Mesh(gripGeo, gripMat);
    rightGrip.position.set(0.35, 0.1, 0);
    playerGroup.add(rightGrip);
    
    // Energy core
    const coreGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.35, 0);
    playerGroup.add(core);
    
    playerGroup.visible = false;
    scene.add(playerGroup);
    playerMeshRef.current = playerGroup as any;

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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let lastTime = 0;
    let lastSpawn = 0;

    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (delta > 0.1) return;

      const game = gameRef.current;
      const spacing = spacingRef.current;

      if (game.isPlaying && !game.gameOver && !showUpgrade) {
        // Player movement
        let dx = 0;
        let dz = 0;
        const speed = 8;
        if (keys.w) dz -= 1;
        if (keys.s) dz += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;

        if (dx !== 0 || dz !== 0) {
          const len = Math.sqrt(dx * dx + dz * dz);
          dx /= len;
          dz /= len;
          
          game.playerPos.x += dx * speed * delta;
          game.playerPos.z += dz * speed * delta;

          const maxDist = Math.floor(cols / 2) * spacing - 1;
          game.playerPos.x = Math.max(-maxDist, Math.min(maxDist, game.playerPos.x));
          game.playerPos.z = Math.max(-maxDist, Math.min(maxDist, game.playerPos.z));
        }

        // Update player gun position and aim at nearest enemy
        if (playerMeshRef.current) {
          playerMeshRef.current.visible = true;
          playerMeshRef.current.position.x = game.playerPos.x;
          playerMeshRef.current.position.y = 0;
          playerMeshRef.current.position.z = game.playerPos.z;
          
          // Find nearest enemy to aim at
          let nearestEnemy: Enemy | null = null;
          let nearestDist = Infinity;
          for (const enemy of game.enemies) {
            if (!enemy.isActive) continue;
            const edx = enemy.x - game.playerPos.x;
            const edz = enemy.z - game.playerPos.z;
            const dist = Math.sqrt(edx * edx + edz * edz);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = enemy;
            }
          }
          
          if (nearestEnemy) {
            // Aim at nearest enemy
            const targetAngle = Math.atan2(
              nearestEnemy.x - game.playerPos.x,
              nearestEnemy.z - game.playerPos.z
            );
            // Smooth rotation toward target
            let currentAngle = playerMeshRef.current.rotation.y;
            let diff = targetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            playerMeshRef.current.rotation.y += diff * 10 * delta;
          } else {
            // Idle rotation when no enemies
            playerMeshRef.current.rotation.y += delta;
          }
        }

        if (cameraRef.current) {
          const targetX = game.playerPos.x;
          const targetZ = game.playerPos.z;
          cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 2 * delta;
          cameraRef.current.position.z += (targetZ + camDist * 0.6 - cameraRef.current.position.z) * 2 * delta;
          cameraRef.current.lookAt(targetX, 0, targetZ);
        }

        // Spawn enemies by converting transaction blocks
        const spawnRate = Math.max(400, 1500 - game.wave * 150);
        if (time - lastSpawn > spawnRate) {
          lastSpawn = time;
          
          // Find available (non-occupied) blocks
          const available: number[] = [];
          for (let i = 0; i < visibleCount; i++) {
            if (!game.occupiedBlocks.has(i)) {
              const pos = getTxPosition(i);
              if (pos) {
                // Don't spawn too close to player
                const pdx = pos.x * spacing - game.playerPos.x;
                const pdz = pos.z * spacing - game.playerPos.z;
                const dist = Math.sqrt(pdx * pdx + pdz * pdz);
                if (dist > 8) {
                  available.push(i);
                }
              }
            }
          }
          
          if (available.length > 0) {
            const blockIndex = available[Math.floor(Math.random() * available.length)];
            const blockMesh = txMeshesRef.current.get(blockIndex);
            const pos = getTxPosition(blockIndex);
            
            if (blockMesh && pos) {
              game.occupiedBlocks.add(blockIndex);
              
              // Transform block into enemy
              (blockMesh.material as THREE.MeshStandardMaterial).color.setHex(ENEMY_COLOR);
              (blockMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
              (blockMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
              
              // Rise up animation
              const originalY = (blockMesh as any).userData.originalHeight;
              blockMesh.position.y = originalY + 0.5;
              
              game.enemies.push({
                id: enemyIdCounter.current++,
                x: pos.x * spacing,
                z: pos.z * spacing,
                index: blockIndex,
                mesh: blockMesh,
                originalY,
                hp: 25 + game.wave * 8,
                maxHp: 25 + game.wave * 8,
                speed: 2.5 + game.wave * 0.25,
                isActive: true,
              });

              if (game.enemies.length % 8 === 0) {
                game.wave++;
                setWave(game.wave);
              }
            }
          }
        }

        // Auto-attack nearest enemy
        if (time - lastShotRef.current > game.stats.fireRate) {
          lastShotRef.current = time;
          
          let nearest: Enemy | null = null;
          let nearestDist = Infinity;
          
          for (const enemy of game.enemies) {
            if (!enemy.isActive) continue;
            const edx = enemy.x - game.playerPos.x;
            const edz = enemy.z - game.playerPos.z;
            const dist = Math.sqrt(edx * edx + edz * edz);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = enemy;
            }
          }

          if (nearest) {
            for (let i = 0; i < game.stats.projectileCount; i++) {
              const angle = Math.atan2(nearest.z - game.playerPos.z, nearest.x - game.playerPos.x);
              const spread = game.stats.projectileCount > 1 ? (i - (game.stats.projectileCount - 1) / 2) * 0.2 : 0;
              const finalAngle = angle + spread;
              
              const projGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
              const projMat = new THREE.MeshStandardMaterial({
                color: 0xffeb3b,
                emissive: 0xffaa00,
                emissiveIntensity: 0.8,
              });
              const projMesh = new THREE.Mesh(projGeo, projMat);
              projMesh.position.set(game.playerPos.x, 0, game.playerPos.z);
              scene.add(projMesh);
              
              game.projectiles.push({
                id: projectileIdCounter.current++,
                x: game.playerPos.x,
                z: game.playerPos.z,
                dx: Math.cos(finalAngle) * game.stats.projectileSpeed,
                dz: Math.sin(finalAngle) * game.stats.projectileSpeed,
                mesh: projMesh,
                damage: game.stats.damage,
                life: 2,
              });
            }
          }
        }

        // Update projectiles
        for (let i = game.projectiles.length - 1; i >= 0; i--) {
          const p = game.projectiles[i];
          p.x += p.dx * delta;
          p.z += p.dz * delta;
          p.life -= delta;
          
          p.mesh.position.x = p.x;
          p.mesh.position.z = p.z;
          p.mesh.rotation.x += 5 * delta;
          p.mesh.rotation.z += 5 * delta;

          // Check collision with enemies
          for (let j = game.enemies.length - 1; j >= 0; j--) {
            const e = game.enemies[j];
            if (!e.isActive) continue;
            
            const edx = p.x - e.x;
            const edz = p.z - e.z;
            const dist = Math.sqrt(edx * edx + edz * edz);
            
            if (dist < 1.2) {
              e.hp -= p.damage;
              
              // Damage flash
              (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
              (e.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
              setTimeout(() => {
                if (e.isActive) {
                  (e.mesh.material as THREE.MeshStandardMaterial).color.setHex(ENEMY_COLOR);
                  (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
                  (e.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
                }
              }, 80);

              if (e.hp <= 0) {
                // Enemy died - return block to normal and drop satoshi
                e.isActive = false;
                
                // Create satoshi pickup
                const satoshiGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
                const satoshiMat = new THREE.MeshStandardMaterial({
                  color: 0xffd700,
                  emissive: 0xffaa00,
                  emissiveIntensity: 0.8,
                });
                const satoshiMesh = new THREE.Mesh(satoshiGeo, satoshiMat);
                satoshiMesh.position.set(e.x, 0, e.z);
                scene.add(satoshiMesh);
                
                game.satoshis.push({
                  x: e.x,
                  z: e.z,
                  index: e.index,
                  value: 10 + game.wave * 3,
                  mesh: satoshiMesh,
                });

                game.score += 10 + game.wave * 3;
                game.xp += 15;
                setScore(game.score);

                // Level up
                if (game.xp >= game.xpToNext) {
                  game.xp -= game.xpToNext;
                  game.level++;
                  game.xpToNext = Math.floor(game.xpToNext * 1.25);
                  setLevel(game.level);
                  game.isPlaying = false;
                  setUpgradeOptions(selectUpgrades());
                  setShowUpgrade(true);
                }

                // Return block to normal after delay
                setTimeout(() => resetBlockToNormal(e), 100);
              }
              
              scene.remove(p.mesh);
              game.projectiles.splice(i, 1);
              break;
            }
          }

          if (p.life <= 0) {
            scene.remove(p.mesh);
            game.projectiles.splice(i, 1);
          }
        }

        // Update enemies (move their blocks toward player)
        for (const e of game.enemies) {
          if (!e.isActive) continue;
          
          const edx = game.playerPos.x - e.x;
          const edz = game.playerPos.z - e.z;
          const dist = Math.sqrt(edx * edx + edz * edz);
          
          if (dist > 0.8) {
            e.x += (edx / dist) * e.speed * delta;
            e.z += (edz / dist) * e.speed * delta;
            e.mesh.position.x = e.x;
            e.mesh.position.z = e.z;
            // Bobbing animation while moving
            e.mesh.position.y = e.originalY + 0.5 + Math.sin(time * 0.01 + e.id) * 0.2;
            e.mesh.rotation.y += 3 * delta;
            e.mesh.rotation.x = Math.sin(time * 0.005 + e.id) * 0.1;
          } else {
            game.gameOver = true;
            setGameOver(true);
            if (game.score > highScore) setHighScore(game.score);
          }
        }

        // Collect satoshis
        for (let i = game.satoshis.length - 1; i >= 0; i--) {
          const s = game.satoshis[i];
          const sdx = game.playerPos.x - s.x;
          const sdz = game.playerPos.z - s.z;
          const dist = Math.sqrt(sdx * sdx + sdz * sdz);
          
          if (dist < game.stats.magnetRange) {
            s.x += (sdx / Math.max(dist, 0.1)) * 10 * delta;
            s.z += (sdz / Math.max(dist, 0.1)) * 10 * delta;
            s.mesh.position.x = s.x;
            s.mesh.position.z = s.z;
          }
          
          s.mesh.rotation.y += 5 * delta;

          if (dist < 1) {
            scene.remove(s.mesh);
            game.satoshis.splice(i, 1);
            game.score += s.value;
            setScore(game.score);
          }
        }

        // Highlight block under player
        txMeshesRef.current.forEach((mesh) => {
          const userData = (mesh as any).userData;
          if (userData.isEnemy) return;
          
          const mdx = game.playerPos.x - mesh.position.x;
          const mdz = game.playerPos.z - mesh.position.z;
          const dist = Math.sqrt(mdx * mdx + mdz * mdz);
          
          if (dist < 1.5) {
            mesh.scale.setScalar(1.15);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
          } else {
            mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 5 * delta);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
          }
        });
      }

      renderer.render(scene, camera);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [showUpgrade, resetBlockToNormal, getTxPosition, selectUpgrades, highScore]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" style={{ top: "var(--header-total)" }} />

      {showStart && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
          <div className="text-center">
            <h1 className="font-mono text-4xl font-bold text-primary mb-2">SATOSHI SURVIVORS</h1>
            <p className="font-mono text-zinc-400 mb-2">The Blocks Are Alive</p>
            <p className="font-mono text-sm text-zinc-500 mb-2">Block {blockHeight.toLocaleString()}</p>
            <p className="font-mono text-sm text-zinc-500 mb-8">
              Transaction blocks will rise and chase you!<br/>
              WASD to move • Auto-attack • Collect satoshis
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

      {showUpgrade && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/80 z-40">
          <div className="text-center max-w-md">
            <h2 className="font-mono text-3xl font-bold text-primary mb-2">LEVEL UP!</h2>
            <p className="font-mono text-zinc-400 mb-6">Choose an upgrade</p>
            <div className="space-y-3">
              {upgradeOptions.map((upgrade) => (
                <button
                  key={upgrade.id}
                  onClick={() => applyUpgrade(upgrade)}
                  className="w-full p-4 br-card bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{upgrade.icon}</span>
                    <div>
                      <div className="font-mono font-bold text-white">{upgrade.name}</div>
                      <div className="font-mono text-xs text-zinc-400">{upgrade.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
          <div className="text-center">
            <h1 className="font-mono text-4xl font-bold text-red-500 mb-4">GAME OVER</h1>
            <p className="font-mono text-xl text-zinc-400 mb-2">Score: {score}</p>
            <p className="font-mono text-sm text-zinc-500 mb-6">Level {level} • Wave {wave}</p>
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
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {!showStart && !gameOver && !showUpgrade && (
        <>
          <div className="absolute top-20 right-6 z-10 flex gap-2">
            <div className="br-card px-3 py-2">
              <span className="font-mono text-xs text-zinc-500">LVL</span>
              <span className="font-mono text-xl font-bold text-primary ml-1">{level}</span>
            </div>
            <div className="br-card px-4 py-2">
              <span className="font-mono text-2xl font-bold text-primary">{score}</span>
              <span className="font-mono text-xs text-zinc-500 ml-1">sats</span>
            </div>
          </div>

          <div className="absolute top-20 left-6 z-10">
            <div className="br-card px-3 py-2">
              <span className="font-mono text-xs text-zinc-500">WAVE</span>
              <span className="font-mono text-xl font-bold text-red-400 ml-1">{wave}</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-10">
            <div className="br-card p-3 bg-bg/80">
              <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">Controls</div>
              <div className="font-mono text-xs text-zinc-300 space-y-1">
                <div>WASD — Move</div>
                <div>ESC — Exit</div>
              </div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="absolute bottom-6 right-6 z-10 px-4 py-2 br-card font-mono text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Exit
          </button>
        </>
      )}
    </div>
  );
}
