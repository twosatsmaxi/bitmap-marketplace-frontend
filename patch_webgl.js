const fs = require('fs');

let code = fs.readFileSync('src/components/explore/WebGLBitmapRenderer.tsx', 'utf-8');

// 1. Add import
code = code.replace(
  'import { acquireSharedGL, releaseSharedGL, type SharedGL } from "./webgl-context";',
  'import { acquireSharedGL, releaseSharedGL, type SharedGL } from "./webgl-context";\nimport { getLayoutCache, setLayoutCache } from "./layout-cache";'
);

// 2. Add heightRef and applyLayoutRef
code = code.replace(
  'const loopActiveRef = useRef(false);',
  'const loopActiveRef = useRef(false);\n  const heightRef = useRef(height);\n  heightRef.current = height;\n  const applyLayoutRef = useRef<((squares: WorkerSquare[], layoutWidth: number, usedHeight: number, isCached: boolean) => void) | null>(null);'
);

// 3. Define applyLayout
const applyLayoutCode = `
  applyLayoutRef.current = (squares: WorkerSquare[], layoutWidth: number, usedHeight: number, isCached: boolean) => {
    const count = Math.min(squares.length, MAX_INSTANCES);

    const data = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const sq = squares[i];
      const off = i * 4;
      data[off] = sq.x;
      data[off + 1] = sq.y;
      data[off + 2] = sq.r;
      data[off + 3] = i;
    }
    instanceDataRef.current = data;

    const start = isCached ? performance.now() - 4000 : performance.now();
    loopActiveRef.current = true;
    const run = (now: number) => {
      if (!ctx2dRef.current || !sharedRef.current || !instanceDataRef.current) {
        loopActiveRef.current = false;
        return;
      }

      const feat = featuresRef.current;
      const flickerIdx =
        feat.enableFlicker && Math.random() < 0.01
          ? Math.floor(Math.random() * count)
          : -1;

      const m = feat.enableRepulsion ? mousePosRef.current : null;

      renderFrame(
        sharedRef.current,
        ctx2dRef.current,
        scaledSize,
        instanceDataRef.current,
        count,
        layoutWidth,
        usedHeight,
        start,
        now,
        flickerIdx,
        m ? m.x : -1,
        m ? m.y : -1,
        1.0,
        feat.enableRepulsion,
        feat.enableFlicker
      );

      const elapsed = now - start;
      const progress = isCached ? 1 : Math.min(1, elapsed / 3000);
      if (progress < 1 || mousePosRef.current) {
        animationRef.current = requestAnimationFrame(run);
      } else {
        loopActiveRef.current = false;
      }
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(run);

    prevDataRef.current = { squares, layoutWidth, usedHeight };
    onResult?.(squares, layoutWidth, usedHeight);
    onStatus("done");
  };
`;

code = code.replace(
  '  // DPR-scaled size',
  applyLayoutCode + '\n  // DPR-scaled size'
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
const fetchRegex = /\(async \(\) => \{[\s\S]*?if \(prevDataRef\.current\) \{[\s\S]*?requestAnimationFrame\(animateOut\);\s*\}\s*\)?[;,]?\s*\}\s*if \(cancelled\) return;[\s\S]*?worker\.postMessage\(\{ type: "layout", buffer, canvasSize: scaledSize \}, \[buffer\]\);\s*\} catch \{[\s\S]*?if \(!cancelled\) onStatus\("error"\);\s*\}\s*\}\)\(\);/;

const newFetch = `(async () => {
      const cached = getLayoutCache(height);
      if (cached) {
        applyLayoutRef.current?.(cached.squares, cached.layoutWidth, cached.usedHeight, true);
        return;
      }

      // Implode previous if exists
      if (prevDataRef.current) {
        const prev = prevDataRef.current;
        const count = Math.min(prev.squares.length, MAX_INSTANCES);

        const data = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          const sq = prev.squares[i];
          const off = i * 4;
          data[off] = sq.x;
          data[off + 1] = sq.y;
          data[off + 2] = sq.r;
          data[off + 3] = i;
        }

        const outStart = performance.now();
        const outDuration = 300;

        await new Promise<void>((resolve) => {
          const animateOut = (now: number) => {
            const elapsed = now - outStart;
            const progress = Math.min(1, elapsed / outDuration);

            renderFrame(
              shared,
              ctx2d,
              scaledSize,
              data,
              count,
              prev.layoutWidth,
              prev.usedHeight,
              0,
              4000, // well past 3s so all squares at final position
              -1,
              -1,
              -1,
              1 - progress
            );

            if (progress < 1 && !cancelled) {
              requestAnimationFrame(animateOut);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(animateOut);
        });
      }

      if (cancelled) return;

      try {
        const res = await fetch(\`\${RENDER_API}/api/explore/blocks/\${height}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        worker.postMessage({ type: "layout", buffer, canvasSize: scaledSize }, [buffer]);
      } catch {
        if (!cancelled) onStatus("error");
      }
    })();`;

code = code.replace(fetchRegex, newFetch);

fs.writeFileSync('src/components/explore/WebGLBitmapRenderer.tsx', code);
