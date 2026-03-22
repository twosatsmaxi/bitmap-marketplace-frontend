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

// Same colors as BlockVisualizer - bucket colors based on transaction value
const BUCKET_COLORS = [0x7e4912, 0xa05a1a, 0xb87326, 0xf7931a, 0xffc12a, 0xffeb3b];
const BUCKET_LABELS = ["<0.001", "0.001-0.01", "0.01-0.1", "0.1-1", "1-10", "10+"];
const BUCKET_SYMBOLS = ["1", "2", "3", "4", "5", "6"];  // Simple numbers for matching
const CARD_BACK_COLOR = 0x1a1a1e;  // Dark grey for face-down cards
const CARD_BACK_COLOR_HOVER = 0x2a2a35;  // Lighter on hover
const CARD_BACK_COLOR_DARK = 0x0d0d10;
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
  const [firstPlay, setFirstPlay] = useState(true);
  const [flippedCardIds, setFlippedCardIds] = useState<number[]>([]);  // Track which cards are flipped for UI overlay

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

  // Load high score from localStorage and reset game state on mount
  useEffect(() => {
    const saved = localStorage.getItem(`memoryMatch_highScore_${blockHeight}`);
    if (saved) setHighScore(parseInt(saved, 10));
    
    // Check if first time playing
    const hasPlayed = localStorage.getItem(`memoryMatch_hasPlayed_${blockHeight}`);
    setFirstPlay(!hasPlayed);
    
    // Always start with the start screen
    setShowStart(true);
    setGameOver(false);
    setScore(0);
    setMoves(0);
    setTimeElapsed(0);
    gameRef.current.isPlaying = false;
    gameRef.current.isGameOver = false;
  }, [blockHeight]);

  // Initialize cards from block bytes
  const initializeCards = useCallback((): Card[] => {
    const cards: Card[] = [];
    const txCount = blockBytes.length;
    
    // Need at least 2 transactions to play
    if (txCount < 2) {
      return [
        { id: 0, bucket: 3, isFlipped: false, isMatched: false },
        { id: 1, bucket: 3, isFlipped: false, isMatched: false },
      ];
    }
    
    // Create card for every transaction
    for (let i = 0; i < txCount; i++) {
      cards.push({
        id: i,
        bucket: blockBytes[i],
        isFlipped: false,
        isMatched: false,
      });
    }
    
    return cards;
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
    
    // Mark that user has played this block
    localStorage.setItem(`memoryMatch_hasPlayed_${blockHeight}`, "true");
    setFirstPlay(false);
    
    setScore(0);
    setMoves(0);
    setTimeElapsed(0);
    setGameOver(false);
    setShowStart(false);
    setMatchAnimation({ active: false, bucket: 0 });
    
    // Reset cube visuals
    if (cardsGroupRef.current) {
      cardsGroupRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh && mesh.userData.originalPos) {
          mesh.rotation.y = 0;
          mesh.position.set(mesh.userData.originalPos.x, mesh.userData.originalPos.y, mesh.userData.originalPos.z);
          mesh.scale.setScalar(1);
          mesh.userData.isFaceUp = false;
          
          // Reset material to back color (single material for cubes)
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color.setHex(mesh.userData.isDisabled ? 0x333333 : CARD_BACK_COLOR);
          material.emissive.setHex(mesh.userData.isDisabled ? 0x000000 : 0x111111);
          material.emissiveIntensity = 0.1;
          material.opacity = mesh.userData.isDisabled ? 0.3 : 0.9;
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
    
    // Check if card is disabled (odd one out)
    const mesh = cardsGroupRef.current?.children[cardIndex] as THREE.Mesh;
    if (mesh?.userData.isDisabled) return;
    
    // Flip the card
    card.isFlipped = true;
    game.flippedCards.push(cardIndex);
    setFlippedCardIds([...game.flippedCards]);  // Update UI
    
    // Animate cube reveal - scale up and change color
    const cubeMesh = cardsGroupRef.current?.children[cardIndex] as THREE.Mesh;
    if (cubeMesh) {
      const duration = 300;
      const startTime = Date.now();
      const startScale = cubeMesh.scale.x;
      const targetScale = 1.2;
      
      const animateReveal = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Scale animation
        const currentScale = startScale + (targetScale - startScale) * Math.sin(progress * Math.PI);
        cubeMesh.scale.setScalar(currentScale);
        
        // Change color to reveal bucket
        if (progress >= 0.3 && !cubeMesh.userData.isFaceUp) {
          cubeMesh.userData.isFaceUp = true;
          const material = cubeMesh.material as THREE.MeshStandardMaterial;
          material.color.setHex(BUCKET_COLORS[card.bucket - 1] || BUCKET_COLORS[0]);
          material.emissive.setHex(BUCKET_COLORS[card.bucket - 1] || BUCKET_COLORS[0]);
          material.emissiveIntensity = 0.4;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateReveal);
        } else {
          cubeMesh.scale.setScalar(1.1); // Keep slightly larger when revealed
        }
      };
      animateReveal();
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
          setFlippedCardIds([]);
          
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
        // No match - flip back (hide)
        setTimeout(() => {
          [first, second].forEach(idx => {
            const c = game.cards[idx];
            c.isFlipped = false;
            
            const mesh = cardsGroupRef.current?.children[idx] as THREE.Mesh;
            if (mesh) {
              const duration = 300;
              const startTime = Date.now();
              const startScale = mesh.scale.x;
              
              const animateHide = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Scale down animation
                const currentScale = startScale - (startScale - 1) * progress;
                mesh.scale.setScalar(Math.max(1, currentScale));
                
                // Change color back to hidden
                if (progress >= 0.5 && mesh.userData.isFaceUp) {
                  mesh.userData.isFaceUp = false;
                  const material = mesh.material as THREE.MeshStandardMaterial;
                  material.color.setHex(CARD_BACK_COLOR);
                  material.emissive.setHex(0x111111);
                  material.emissiveIntensity = 0.1;
                }
                
                if (progress < 1) {
                  requestAnimationFrame(animateHide);
                }
              };
              animateHide();
            }
          });
          
          game.flippedCards = [];
          setFlippedCardIds([]);
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
    const totalCards = Math.max(2, txCount); // Show all transactions
    
    // Calculate grid layout
    const cols = Math.max(1, Math.ceil(Math.sqrt(totalCards)));
    const rows = Math.max(1, Math.ceil(totalCards / cols));
    const spacing = 2.5;
    const gridWidth = Math.max(0, (cols - 1) * spacing);
    const gridHeight = Math.max(0, (rows - 1) * spacing);

    // Camera - top-down view for memory game
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const viewSize = Math.max(gridWidth, gridHeight);
    const camHeight = Math.max(15, viewSize * 0.8);
    camera.position.set(0, camHeight, 0);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, -1);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - brighter for top-down view
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);
    
    // Additional light from bottom to illuminate card faces
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);

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

    // Check if odd number of transactions - last card will be disabled
    const isOddCount = txCount % 2 === 1 && txCount >= 2;
    const disabledIndex = isOddCount ? txCount - 1 : -1;
    
    // Create 3D cubes like BlockVisualizer
    for (let i = 0; i < totalCards; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * spacing;
      const z = (row - (rows - 1) / 2) * spacing;
      
      const isDisabled = i === disabledIndex;
      const bucket = blockBytes[i];
      
      // Same sizing as BlockVisualizer
      const size = 0.4 + bucket * 0.3;
      const height = 0.3 + bucket * 0.4;
      const color = isDisabled ? 0x333333 : CARD_BACK_COLOR;
      
      const geometry = new THREE.BoxGeometry(size, height, size);
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: isDisabled ? 0.3 : 0.9,
        emissive: isDisabled ? 0x000000 : 0x111111,
        emissiveIntensity: 0.1,
        roughness: 0.4,
        metalness: 0.3,
      });
      
      const cubeMesh = new THREE.Mesh(geometry, material);
      cubeMesh.position.set(x, height / 2, z);
      
      // Store data in userData
      cubeMesh.userData = { 
        cardIndex: i, 
        isFaceUp: false,
        originalPos: { x, y: height / 2, z },
        isDisabled: isDisabled,
        bucket: bucket,
        originalY: height / 2,
        size: size,
        height: height
      };
      
      // For disabled cards, mark as matched
      if (isDisabled && gameRef.current.cards[i]) {
        gameRef.current.cards[i].isMatched = true;
      }
      
      cardsGroup.add(cubeMesh);
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
        if (prevMesh && prevMesh.userData.originalPos && !gameRef.current.cards[hoveredCard]?.isFlipped) {
          prevMesh.position.y = prevMesh.userData.originalPos.y;
        }
        hoveredCard = null;
        container.style.cursor = "default";
      }
      
      // Apply hover (only for non-disabled, non-flipped cards)
      if (intersects.length > 0 && gameRef.current.isPlaying && !gameRef.current.isGameOver) {
        const mesh = intersects[0].object as THREE.Mesh;
        const cardIndex = mesh.userData.cardIndex;
        
        if (cardIndex !== undefined && cardIndex >= 0 && cardIndex < gameRef.current.cards.length) {
          const card = gameRef.current.cards[cardIndex];
          const isDisabled = mesh.userData.isDisabled;
          
          if (card && !card.isFlipped && !card.isMatched && !isDisabled) {
            hoveredCard = cardIndex;
            // Lift cube up slightly
            mesh.position.y = mesh.userData.originalPos.y + 0.3;
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
          // Handle both single material and material arrays
          const materials = child.material;
          if (Array.isArray(materials)) {
            materials.forEach(mat => mat.dispose());
          } else {
            materials.dispose();
          }
        }
      });
    };
  }, [blockBytes, handleCardClick]);



  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get number color for the flipped card overlay (white for visibility on all bucket colors)
  const getNumberColor = (_bucket: number): string => "#ffffff";

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" style={{ top: "var(--header-total)" }} />

      {/* Match Animation Overlay */}
      {matchAnimation.active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="flex flex-col items-center">
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center mb-3 shadow-2xl animate-bounce"
              style={{ 
                backgroundColor: `#${BUCKET_COLORS[3].toString(16).padStart(6, "0")}`,
                boxShadow: '0 0 30px rgba(203, 120, 37, 0.8)'
              }}
            >
              <span 
                className="text-white font-bold text-4xl drop-shadow-lg"
                style={{ color: getNumberColor(matchAnimation.bucket) }}
              >
                {BUCKET_SYMBOLS[matchAnimation.bucket - 1]}
              </span>
            </div>
            <div className="px-6 py-2 bg-primary text-black font-mono font-bold text-xl rounded">
              MATCH!
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {showStart && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/95 z-50">
          <div className="text-center max-w-md px-6">
            <h1 className="font-mono text-4xl font-bold text-primary mb-4">MEMORY MATCH</h1>
            
            {/* Visual Card Examples */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="text-center">
                <div 
                  className="w-16 h-20 rounded border-2 border-zinc-600 flex items-center justify-center mb-2 mx-auto"
                  style={{ backgroundColor: `#${CARD_BACK_COLOR.toString(16).padStart(6, "0")}` }}
                >
                  <span className="text-zinc-500 text-xs">?</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">Hidden</span>
              </div>
              <div className="flex items-center text-zinc-600">→</div>
              <div className="text-center">
                <div 
                  className="w-16 h-20 rounded border-2 flex items-center justify-center mb-2 mx-auto shadow-lg"
                  style={{ 
                    backgroundColor: `#${BUCKET_COLORS[3].toString(16).padStart(6, "0")}`,
                    borderColor: `#${BUCKET_COLORS[3].toString(16).padStart(6, "0")}`,
                    boxShadow: '0 0 20px rgba(203, 120, 37, 0.5)'
                  }}
                >
                  <span className="text-white font-bold text-2xl drop-shadow-md">{BUCKET_SYMBOLS[2]}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">Revealed</span>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 rounded-lg p-4 mb-6">
              <p className="font-mono text-sm text-zinc-300 mb-2">
                <span className="text-primary font-bold">1.</span> Click cards to flip them
              </p>
              <p className="font-mono text-sm text-zinc-300 mb-2">
                <span className="text-primary font-bold">2.</span> Find two cards with the <span className="text-primary">same number</span>
              </p>
              <p className="font-mono text-sm text-zinc-300">
                <span className="text-primary font-bold">3.</span> Match all pairs to win!
              </p>
            </div>
            
            <p className="font-mono text-xs text-zinc-600 mb-6">
              Block {blockHeight.toLocaleString()} • {Math.floor(blockBytes.length / 2)} pairs to match
            </p>
            
            {highScore > 0 && (
              <p className="font-mono text-sm text-zinc-400 mb-4">High Score: {highScore}</p>
            )}
            <button
              onClick={startGame}
              className="px-10 py-4 bg-primary text-black font-mono font-bold text-lg rounded hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20"
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
          {/* Card Number Overlays - shown on flipped cards */}
          {flippedCardIds.map((cardIndex) => {
            const card = gameRef.current.cards[cardIndex];
            if (!card) return null;
            
            // Calculate grid position
            const txCount = blockBytes.length;
            const cols = Math.max(1, Math.ceil(Math.sqrt(txCount)));
            const spacing = 2.5;
            const col = cardIndex % cols;
            const row = Math.floor(cardIndex / cols);
            const x = (col - (cols - 1) / 2) * spacing;
            const z = (row - (cols - 1) / 2) * spacing;
            
            // Convert 3D position to screen position (approximate for top-down view)
            const centerX = 50; // center of screen in %
            const centerY = 55; // slightly below center
            const scale = 12; // scale factor to convert 3D units to screen %
            
            const screenX = centerX + (x * scale);
            const screenY = centerY + (z * scale * 0.6); // aspect ratio correction
            
            return (
              <div
                key={`card-${cardIndex}`}
                className="absolute z-15 pointer-events-none flex items-center justify-center"
                style={{
                  left: `${screenX}%`,
                  top: `${screenY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '60px',
                  height: '60px',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: `#${BUCKET_COLORS[3].toString(16).padStart(6, "0")}`,
                    boxShadow: '0 0 15px rgba(203, 120, 37, 0.6)'
                  }}
                >
                  <span 
                    className="font-bold text-2xl drop-shadow-md"
                    style={{ color: getNumberColor(card.bucket) }}
                  >
                    {BUCKET_SYMBOLS[card.bucket - 1]}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Instruction hint */}
          {firstPlay && flippedCardIds.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="br-card px-6 py-4 bg-bg/90 border border-primary/30">
                <p className="font-mono text-lg text-primary font-bold mb-1">Click any card to flip</p>
                <p className="font-mono text-xs text-zinc-400">Find cards with matching numbers</p>
              </div>
            </div>
          )}
          
          {/* Flipped Cards Counter */}
          {flippedCardIds.length > 0 && flippedCardIds.length < 2 && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20">
              <div className="br-card px-4 py-2 bg-bg/80">
                <span className="font-mono text-sm text-zinc-300">Flip one more card...</span>
              </div>
            </div>
          )}
          
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
              <div className="font-mono text-[10px] uppercase text-zinc-500 mb-2">Match by Number</div>
              <div className="flex gap-1">
                {BUCKET_SYMBOLS.map((symbol, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="w-7 h-8 rounded flex items-center justify-center mb-1" 
                      style={{ backgroundColor: `#${BUCKET_COLORS[3].toString(16).padStart(6, "0")}` }}
                    >
                      <span className="text-white font-bold text-sm drop-shadow">{symbol}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-zinc-500 mt-2 text-center">
                Find two cards with the same number
              </p>
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
