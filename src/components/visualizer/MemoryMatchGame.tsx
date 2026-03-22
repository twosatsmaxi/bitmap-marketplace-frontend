"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface MemoryMatchGameProps {
  blockBytes: Uint8Array;
  blockHeight: number;
}

interface Card {
  id: number;
  bucket: number;
  isFlipped: boolean;
  isMatched: boolean;
  mesh?: THREE.Mesh;
  originalPos: { x: number; y: number; z: number };
}

interface GameState {
  cards: Card[];
  flippedCards: number[];
  moves: number;
  matches: number;
  startTime: number;
  isPlaying: boolean;
  isGameOver: boolean;
}

const BUCKET_COLORS = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b];
const BUCKET_LABELS = ["<0.001", "0.001-0.01", "0.01-0.1", "0.1-1", "1-10", "10+"];
const CARD_BACK_COLOR = 0x1a1a1e;
const MATCH_ANIMATION_DURATION = 600;

export function MemoryMatchGame({ blockBytes, blockHeight }: MemoryMatchGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showStart, setShowStart] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState<{ active: boolean; bucket: number }>({ active: false, bucket: 0 });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cardsGroupRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const gameRef = useRef<GameState>({
    cards: [],
    flippedCards: [],
    moves: 0,
    matches: 0,
    startTime: 0,
    isPlaying: false,
    isGameOver: false,
  });

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`memoryMatch_highScore_${blockHeight}`);
    if (saved) setHighScore(parseInt(saved, 10));
  }, [blockHeight]);

  // Initialize cards from block bytes
  const initializeCards = useCallback((): Card[] => {
    // Create pairs from block bytes
    const pairs: Card[] = [];
    const txCount = blockBytes.length;
    
    // Need at least 2 transactions to play
    if (txCount < 2) {
      // Return minimal placeholder cards for demo (both same value)
      return [
        { id: 0, bucket: 3, isFlipped: false, isMatched: false, originalPos: { x: 0, y: 0, z: 0 } },
        { id: 1, bucket: 3, isFlipped: false, isMatched: false, originalPos: { x: 0, y: 0, z: 0 } },
      ];
    }
    
    // If odd number, we'll have one single card (no pair for last one)
    const pairCount = Math.floor(txCount / 2);
    
    for (let i = 0; i < pairCount * 2; i++) {
      pairs.push({
        id: i,
        bucket: blockBytes[i],
        isFlipped: false,
        isMatched: false,
        originalPos: { x: 0, y: 0, z: 0 },
      });
    }
    
    // Shuffle cards using Fisher-Yates
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    
    return pairs;
  }, [blockBytes]);

  // Calculate score based on moves and time
  const calculateScore = useCallback((moves: number, timeSeconds: number, totalPairs: number): number => {
    const baseScore = totalPairs * 100;
    const movePenalty = Math.max(0, (moves - totalPairs) * 10);
    const timeBonus = Math.max(0, 300 - timeSeconds) * 2;
    return Math.max(0, baseScore - movePenalty + timeBonus);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    const cards = initializeCards();
    
    gameRef.current = {
      cards,
      flippedCards: [],
      moves: 0,
      matches: 0,
      startTime: Date.now(),
      isPlaying: true,
      isGameOver: false,
    };
    
    setScore(0);
    setMoves(0);
    setTimeElapsed(0);
    setGameOver(false);
    setShowStart(false);
    setMatchAnimation({ active: false, bucket: 0 });
    
    // Reset card visuals
    if (cardsGroupRef.current) {
      cardsGroupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const card = cards[index];
        if (card && mesh) {
          mesh.rotation.y = 0;
          mesh.position.set(card.originalPos.x, card.originalPos.y, card.originalPos.z);
          mesh.scale.setScalar(1);
          (mesh.material as THREE.MeshStandardMaterial).opacity = 1;
        }
      });
    }
  }, [initializeCards]);

  // Reset to menu
  const resetGame = useCallback(() => {
    gameRef.current.isPlaying = false;
    setShowStart(true);
    setGameOver(false);
  }, []);

  // Handle card click
  const handleCardClick = useCallback((cardIndex: number) => {
    const game = gameRef.current;
    if (!game.isPlaying || game.isGameOver) return;
    
    const card = game.cards[cardIndex];
    if (!card || card.isFlipped || card.isMatched || game.flippedCards.length >= 2) return;
    
    // Flip the card
    card.isFlipped = true;
    game.flippedCards.push(cardIndex);
    
    // Animate flip
    const cardMesh = cardsGroupRef.current?.children[cardIndex] as THREE.Mesh;
    if (cardMesh) {
      const targetRotation = Math.PI;
      const startRotation = cardMesh.rotation.y;
      const duration = 300;
      const startTime = Date.now();
      
      const animateFlip = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        cardMesh.rotation.y = startRotation + (targetRotation - startRotation) * easeProgress;
        
        // Change color at halfway point
        if (progress >= 0.5) {
          const mat = cardMesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(BUCKET_COLORS[card.bucket - 1] || BUCKET_COLORS[0]);
          mat.emissive.setHex(BUCKET_COLORS[card.bucket - 1] || BUCKET_COLORS[0]);
          mat.emissiveIntensity = 0.5;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateFlip);
        }
      };
      animateFlip();
    }
    
    // Check for match when 2 cards are flipped
    if (game.flippedCards.length === 2) {
      game.moves++;
      setMoves(game.moves);
      
      const [first, second] = game.flippedCards;
      const firstCard = game.cards[first];
      const secondCard = game.cards[second];
      
      if (firstCard.bucket === secondCard.bucket) {
        // Match found!
        setTimeout(() => {
          firstCard.isMatched = true;
          secondCard.isMatched = true;
          game.matches++;
          game.flippedCards = [];
          
          // Show match animation
          setMatchAnimation({ active: true, bucket: firstCard.bucket });
          setTimeout(() => setMatchAnimation({ active: false, bucket: 0 }), 1000);
          
          // Animate matched cards
          [first, second].forEach(idx => {
            const mesh = cardsGroupRef.current?.children[idx] as THREE.Mesh;
            if (mesh) {
              const startY = mesh.position.y;
              const startTime = Date.now();
              
              const animateMatch = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / MATCH_ANIMATION_DURATION, 1);
                
                mesh.position.y = startY + Math.sin(progress * Math.PI) * 0.5;
                mesh.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.2);
                
                if (progress < 1) {
                  requestAnimationFrame(animateMatch);
                } else {
                  mesh.scale.setScalar(1.1);
                }
              };
              animateMatch();
            }
          });
          
          // Check for game over
          const totalPairs = Math.floor(game.cards.length / 2);
          if (game.matches >= totalPairs) {
            game.isGameOver = true;
            const finalTime = Math.floor((Date.now() - game.startTime) / 1000);
            const finalScore = calculateScore(game.moves, finalTime, totalPairs);
            setScore(finalScore);
            setTimeElapsed(finalTime);
            
            if (finalScore > highScore) {
              setHighScore(finalScore);
              localStorage.setItem(`memoryMatch_highScore_${blockHeight}`, finalScore.toString());
            }
            
            setTimeout(() => setGameOver(true), 1000);
          }
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          [first, second].forEach(idx => {
            const c = game.cards[idx];
            c.isFlipped = false;
            
            const mesh = cardsGroupRef.current?.children[idx] as THREE.Mesh;
            if (mesh) {
              const targetRotation = 0;
              const startRotation = mesh.rotation.y;
              const duration = 300;
              const startTime = Date.now();
              
              const animateFlipBack = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                mesh.rotation.y = startRotation + (targetRotation - startRotation) * easeProgress;
                
                if (progress >= 0.5) {
                  const mat = mesh.material as THREE.MeshStandardMaterial;
                  mat.color.setHex(CARD_BACK_COLOR);
                  mat.emissive.setHex(0x000000);
                  mat.emissiveIntensity = 0;
                }
                
                if (progress < 1) {
                  requestAnimationFrame(animateFlipBack);
                }
              };
              animateFlipBack();
            }
          });
          
          game.flippedCards = [];
        }, 1000);
      }
    }
  }, [blockHeight, calculateScore, highScore]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    const txCount = blockBytes.length;
    const pairCount = Math.floor(txCount / 2);
    const totalCards = Math.max(2, pairCount * 2); // Ensure at least 2 cards minimum
    
    // Calculate grid layout
    const cols = Math.max(1, Math.ceil(Math.sqrt(totalCards)));
    const rows = Math.max(1, Math.ceil(totalCards / cols));
    const spacing = 2.5;
    const gridWidth = Math.max(0, (cols - 1) * spacing);
    const gridHeight = Math.max(0, (rows - 1) * spacing);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    const camDist = Math.max(gridWidth, gridHeight) * 0.8 + 10;
    camera.position.set(0, Math.max(10, camDist * 0.6), Math.max(15, camDist));
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    
    const pointLight = new THREE.PointLight(0xf7931a, 0.3, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Ground
    const groundSize = Math.max(10, Math.max(gridWidth, gridHeight) + 10);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      new THREE.MeshLambertMaterial({ color: 0x121214, transparent: true, opacity: 0.6 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(groundSize, Math.max(2, Math.min(cols * 2, 20)), 0xf7931a, 0x27272a);
    gridHelper.position.y = -1.99;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Create cards
    const cardsGroup = new THREE.Group();
    cardsGroupRef.current = cardsGroup;
    scene.add(cardsGroup);

    const cardGeometry = new THREE.BoxGeometry(1.8, 0.3, 2.2);
    
    for (let i = 0; i < totalCards; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * spacing;
      const z = (row - (rows - 1) / 2) * spacing;
      
      const cardMaterial = new THREE.MeshStandardMaterial({
        color: CARD_BACK_COLOR,
        roughness: 0.4,
        metalness: 0.3,
      });
      
      const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
      cardMesh.position.set(x, 0, z);
      cardMesh.userData = { cardIndex: i };
      
      cardsGroup.add(cardMesh);
      
      // Store original position in game state
      if (gameRef.current.cards[i]) {
        gameRef.current.cards[i].originalPos = { x, y: 0, z };
      }
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = () => {
      if (!gameRef.current.isPlaying || gameRef.current.isGameOver) return;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(cardsGroup.children);
      
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const cardIndex = mesh.userData.cardIndex;
        if (cardIndex !== undefined) {
          handleCardClick(cardIndex);
        }
      }
    };

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    // Animation loop
    let hoveredCard: number | null = null;
    
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Skip if no cards
      if (cardsGroup.children.length === 0) {
        renderer.render(scene, camera);
        return;
      }
      
      // Hover effect
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(cardsGroup.children);
      
      // Reset previous hover
      if (hoveredCard !== null && hoveredCard < cardsGroup.children.length) {
        const prevMesh = cardsGroup.children[hoveredCard] as THREE.Mesh;
        if (prevMesh && gameRef.current.cards[hoveredCard] && !gameRef.current.cards[hoveredCard]?.isFlipped) {
          prevMesh.position.y = 0;
        }
        hoveredCard = null;
        container.style.cursor = "default";
      }
      
      // Apply hover
      if (intersects.length > 0 && gameRef.current.isPlaying && !gameRef.current.isGameOver) {
        const mesh = intersects[0].object as THREE.Mesh;
        const cardIndex = mesh.userData.cardIndex;
        
        if (cardIndex !== undefined && cardIndex >= 0 && cardIndex < gameRef.current.cards.length) {
          const card = gameRef.current.cards[cardIndex];
          
          if (card && !card.isFlipped && !card.isMatched) {
            hoveredCard = cardIndex;
            mesh.position.y = 0.3;
            container.style.cursor = "pointer";
          }
        }
      }
      
      // Update timer
      if (gameRef.current.isPlaying && !gameRef.current.isGameOver) {
        const elapsed = Math.floor((Date.now() - gameRef.current.startTime) / 1000);
        setTimeElapsed(elapsed);
      }
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
      
      cardsGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    };
  }, [blockBytes, handleCardClick]);

  // Update card positions when game starts
  useEffect(() => {
    if (gameRef.current.cards.length > 0 && cardsGroupRef.current) {
      gameRef.current.cards.forEach((card, i) => {
        const mesh = cardsGroupRef.current?.children[i] as THREE.Mesh;
        if (mesh) {
          card.mesh = mesh;
          card.originalPos = { ...mesh.position };
        }
      });
    }
  }, [gameRef.current.cards.length]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" style={{ top: "var(--header-total)" }} />

      {/* Match Animation Overlay */}
      {matchAnimation.active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div 
            className="px-6 py-3 font-mono font-bold text-black text-2xl animate-bounce"
            style={{ 
              backgroundColor: `#${(BUCKET_COLORS[matchAnimation.bucket - 1] || BUCKET_COLORS[0]).toString(16).padStart(6, "0")}`
            }}
          >
            MATCH! {BUCKET_LABELS[matchAnimation.bucket - 1]}
          </div>
        </div>
      )}

      {/* Start Screen */}
      {showStart && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
          <div className="text-center">
            <h1 className="font-mono text-4xl font-bold text-primary mb-2">MEMORY MATCH</h1>
            <p className="font-mono text-zinc-400 mb-2">Block {blockHeight.toLocaleString()}</p>
            <p className="font-mono text-sm text-zinc-500 mb-2">{blockBytes.length.toLocaleString()} transactions</p>
            <p className="font-mono text-sm text-zinc-500 mb-2">Find matching transaction pairs!</p>
            <p className="font-mono text-xs text-zinc-600 mb-8">Flip cards to reveal values • Match = same BTC range</p>
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
          <div className="absolute top-20 right-6 z-10 flex gap-2">
            <div className="br-card px-3 py-2">
              <span className="font-mono text-xs text-zinc-500 block">TIME</span>
              <span className="font-mono text-xl font-bold text-white">{formatTime(timeElapsed)}</span>
            </div>
            <div className="br-card px-3 py-2">
              <span className="font-mono text-xs text-zinc-500 block">MOVES</span>
              <span className="font-mono text-xl font-bold text-primary">{moves}</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-10">
            <div className="br-card p-3 bg-bg/80">
              <div className="font-mono text-[10px] uppercase text-zinc-500 mb-2">Value Ranges</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {BUCKET_LABELS.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: `#${BUCKET_COLORS[i].toString(16).padStart(6, "0")}` }}
                    />
                    <span className="font-mono text-[10px] text-zinc-400">{label} BTC</span>
                  </div>
                ))}
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
    </div>
  );
}
