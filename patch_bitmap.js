const fs = require('fs');

let code = fs.readFileSync('src/components/explore/BitmapRenderer.tsx', 'utf-8');

// 1. Add import
code = code.replace(
  'import { drawBitfeedVacuum } from "./renderFunctions";',
  'import { drawBitfeedVacuum } from "./renderFunctions";\nimport { getLayoutCache, setLayoutCache } from "./layout-cache";'
);

// 2. Add heightRef and applyLayoutRef
code = code.replace(
  'const prevDataRef = useRef<{',
  'const heightRef = useRef(height);\n  heightRef.current = height;\n  const applyLayoutRef = useRef<((squares: WorkerSquare[], layoutWidth: number, usedHeight: number, isCached: boolean) => void) | null>(null);\n\n  const prevDataRef = useRef<{'
);

// 3. Define applyLayout
const applyLayoutCode = `
  applyLayoutRef.current = (squares: WorkerSquare[], layoutWidth: number, usedHeight: number, isCached: boolean) => {
    const currentData = { squares, layoutWidth, usedHeight };

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const start = isCached ? performance.now() - 4000 : performance.now();
        const run = (now: number) => {
          const elapsed = now - start;
          const totalDuration = 3000;
          const progress = Math.min(1, elapsed / totalDuration);
          
          const flickerIndex = Math.random() < 0.01 ? Math.floor(Math.random() * squares.length) : -1;

          drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, scaledSize, progress, start, now, flickerIndex, mousePosRef.current);
          
          if (progress < 1 || mousePosRef.current) {
            animationRef.current = requestAnimationFrame(run);
          }
        };
        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(run);
      }
    }

    prevDataRef.current = currentData;
    onResult?.(squares, layoutWidth, usedHeight);
    onStatus("done");
  };
`;

code = code.replace(
  '  // DPR-scaled size for crisp rendering',
  applyLayoutCode + '\n  // DPR-scaled size for crisp rendering'
);

// 4. Update worker onmessage
const workerMsgRegex = /worker\.onmessage = \(e: MessageEvent\) => \{[\s\S]*?if \(e\.data\.type === "done"\) \{[\s\S]*?const \{ squares, layoutWidth, usedHeight \} = e\.data;[\s\S]*?onStatus\("done"\);\s*\}\s*\};/g;

code = code.replace(workerMsgRegex, `worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        const { squares, layoutWidth, usedHeight } = e.data;
        setLayoutCache(heightRef.current, { squares, layoutWidth, usedHeight });
        applyLayoutRef.current?.(squares, layoutWidth, usedHeight, false);
      }
    };`);

// 5. Update fetch + layout
const fetchRegex = /\(async \(\) => \{[\s\S]*?if \(prevDataRef\.current && canvasRef\.current\) \{[\s\S]*?requestAnimationFrame\(animateOut\);\s*\}\s*\)?[;,]?\s*\}\s*\}[\s\S]*?worker\.postMessage\(\{ type: "layout", buffer, canvasSize: scaledSize \}, \[buffer\]\);\s*\} catch \{[\s\S]*?if \(!cancelled\) onStatus\("error"\);\s*\}\s*\}\)\(\);/;

const newFetch = `(async () => {
      const cached = getLayoutCache(height);
      if (cached) {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = scaledSize;
          canvas.height = scaledSize;
        }
        applyLayoutRef.current?.(cached.squares, cached.layoutWidth, cached.usedHeight, true);
        return;
      }

      // 1. Implode current if exists
      if (prevDataRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const { squares, layoutWidth, usedHeight } = prevDataRef.current;
          const outStart = performance.now();
          const outDuration = 300;
          
          await new Promise<void>((resolve) => {
            const animateOut = (now: number) => {
              const elapsed = now - outStart;
              const progress = Math.min(1, elapsed / outDuration);
              
              // Reverse gravity/implode: scale down to center
              ctx.save();
              ctx.translate(scaledSize / 2, scaledSize / 2);
              ctx.scale(1 - progress, 1 - progress);
              ctx.translate(-scaledSize / 2, -scaledSize / 2);

              drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, scaledSize, 1);
              
              ctx.restore();

              if (progress < 1 && !cancelled) {
                requestAnimationFrame(animateOut);
              } else {
                resolve();
              }
            };
            requestAnimationFrame(animateOut);
          });
        }
      }

      try {
        const res = await fetch(\`\${RENDER_API}/api/explore/blocks/\${height}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = scaledSize;
        canvas.height = scaledSize;

        // We disable OffscreenCanvas for the reveal animation to ensure main thread control
        worker.postMessage({ type: "layout", buffer, canvasSize: scaledSize }, [buffer]);
      } catch {
        if (!cancelled) onStatus("error");
      }
    })();`;

code = code.replace(fetchRegex, newFetch);

fs.writeFileSync('src/components/explore/BitmapRenderer.tsx', code);
