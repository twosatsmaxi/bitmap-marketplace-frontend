"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import WebGLBitmapRenderer from "./WebGLBitmapRenderer";
import BitmapRenderer from "./BitmapRenderer";
import type { BlockMeta, RenderStatus, QualityTier } from "./types";
import { QualityMonitor } from "./quality-monitor";
import StatusPill from "@/components/ui/StatusPill";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { ListingStatus } from "@/lib/types";

const supportsWebGL2 =
  typeof document !== "undefined" &&
  !!document.createElement("canvas").getContext("webgl2");

interface BlockCardProps {
  height: number;
  meta?: BlockMeta;
  listingStatus?: ListingStatus;
  price?: number;
  isometric?: boolean;
  index?: number;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default memo(function BlockCard({ height, meta, listingStatus, price, isometric, index }: BlockCardProps) {
  const [status, setStatus] = useState<RenderStatus>("idle");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [qualityTier, setQualityTier] = useState<QualityTier>(
    supportsWebGL2 ? "full" : "canvas2d"
  );
  const monitorRef = useRef<QualityMonitor>(
    new QualityMonitor(supportsWebGL2 ? "full" : "canvas2d")
  );
  const staticImageRef = useRef<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Track whether renderer has been offloaded (scrolled far off-screen)
  const [offloaded, setOffloaded] = useState(false);
  // Track whether we've already played the entry animation
  const hasAnimatedRef = useRef(false);

  // FPS monitoring via rAF — runs alongside the renderer's own loop
  useEffect(() => {
    if (status !== "done") return;
    const monitor = monitorRef.current;
    let raf = 0;

    const tick = (now: number) => {
      const changed = monitor.recordFrame(now);
      if (changed) {
        setQualityTier(monitor.tier);
      }
      // Stop monitoring once we hit static — nothing left to measure
      if (monitor.tier !== "static") {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [status]);

  const rendererContainerRef = useRef<HTMLDivElement>(null);

  // Observer 1: entry animation trigger (triggerOnce: true)
  const { ref: animRef, isInView } = useInView({ threshold: 0.2, triggerOnce: true });

  // Observer 2: continuous near-viewport tracking for offloading
  const { ref: nearRef, isInView: isNearViewport } = useInView({
    triggerOnce: false,
    rootMargin: "200% 0px",
    threshold: 0,
  });

  // Combined ref for the Link element (both observers need to observe it)
  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      animRef(node);
      nearRef(node);
    },
    [animRef, nearRef]
  );

  // Capture canvas snapshot once render is done + animation has finished
  useEffect(() => {
    if (status !== "done" || offloaded) return;

    const timer = setTimeout(() => {
      if (!rendererContainerRef.current) return;
      const canvas = rendererContainerRef.current.querySelector("canvas");
      if (!canvas) return;
      try {
        const url = canvas.toDataURL("image/webp", 0.8);
        staticImageRef.current = url;
        setSnapshotUrl(url);
        hasAnimatedRef.current = true;
      } catch {
        // toDataURL may fail on tainted canvases — ignore
      }
    }, 3500); // Wait for 3s entry animation + 0.5s buffer

    return () => clearTimeout(timer);
  }, [status, offloaded]);

  // Re-capture snapshot when isometric changes while renderer is mounted
  useEffect(() => {
    if (status !== "done" || offloaded || !hasAnimatedRef.current) return;

    const timer = setTimeout(() => {
      if (!rendererContainerRef.current) return;
      const canvas = rendererContainerRef.current.querySelector("canvas");
      if (!canvas) return;
      try {
        const url = canvas.toDataURL("image/webp", 0.8);
        staticImageRef.current = url;
        setSnapshotUrl(url);
      } catch {
        // ignore
      }
    }, 700); // Wait for isometric transition (600ms) + buffer

    return () => clearTimeout(timer);
  }, [isometric, status, offloaded]);

  // Offload/restore renderer based on viewport proximity
  useEffect(() => {
    // Only offload cards that have finished rendering and have a snapshot
    if (!staticImageRef.current || status !== "done") return;

    if (!isNearViewport) {
      setOffloaded(true);
    } else {
      setOffloaded(false);
    }
  }, [isNearViewport, status]);

  // Generate static fallback image when tier drops to static
  useEffect(() => {
    if (qualityTier === "static" && !staticImageRef.current && rendererContainerRef.current) {
      const canvas = rendererContainerRef.current.querySelector("canvas");
      if (canvas) {
        try {
          staticImageRef.current = canvas.toDataURL("image/png");
          setSnapshotUrl(staticImageRef.current);
          // Force re-render to show the static image
          setQualityTier("static");
        } catch {
          // Security error — stay on canvas2d instead
          monitorRef.current.lock();
          setQualityTier("canvas2d");
        }
      }
    }
  }, [qualityTier]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - card.left;
    const mouseY = e.clientY - card.top;

    // Tilt limit: 8 degrees
    const rotateX = ((mouseY - card.height / 2) / (card.height / 2)) * -8;
    const rotateY = ((mouseX - card.width / 2) / (card.width / 2)) * 8;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Determine whether to show the renderer or the snapshot
  const showSnapshot = offloaded && snapshotUrl;
  const skipEntryAnimation = hasAnimatedRef.current;

  return (
    <Link
      ref={combinedRef}
      href={`/bitmap/${height}.bitmap`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="br-card group flex flex-col overflow-hidden p-0 transition-all hover:border-[rgba(255,255,255,0.15)] active:scale-[0.98]"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.1s ease-out, border-color 0.2s ease",
      }}
      {...(index !== undefined ? { "data-block-index": index } : {})}
    >
      {/* Card head */}
      <div className="flex items-center px-2.5 py-1.5 md:px-3 md:py-2">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#f7a23b]">
          {height}.bitmap
        </span>
      </div>

      {/* Canvas area */}
      <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
        {/* Snapshot layer — visible when offloaded or as backdrop during renderer re-mount */}
        {snapshotUrl && (
          <img
            src={snapshotUrl}
            alt={`Block ${height}`}
            style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
            className={cn(
              "absolute inset-0 block",
              // When renderer is mounted and done, fade out snapshot
              !offloaded && status === "done" ? "opacity-0 transition-opacity duration-500" : "opacity-100"
            )}
          />
        )}

        {/* Renderer — unmounted when offloaded */}
        {!showSnapshot && (
          <div
            ref={rendererContainerRef}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              status === "done" ? "opacity-100" : "opacity-0"
            )}
          >
            {qualityTier === "static" && staticImageRef.current ? (
              <img
                src={staticImageRef.current}
                alt={`Block ${height}`}
                style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
                className="block"
              />
            ) : qualityTier === "canvas2d" ? (
              <BitmapRenderer
                height={height}
                canvasSize={300}
                onStatus={setStatus}
                skipEntryAnimation={skipEntryAnimation}
              />
            ) : (
              <WebGLBitmapRenderer
                height={height}
                canvasSize={300}
                onStatus={setStatus}
                enableRepulsion={qualityTier === "full"}
                enableFlicker={qualityTier === "full"}
                isometric={isometric}
                inView={isInView}
                skipEntryAnimation={skipEntryAnimation}
              />
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {status === "loading" && !showSnapshot && (
          <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-2 rounded-lg bg-[#090c11]">
            <div className="h-1/2 w-1/2 animate-pulse bg-[rgba(247,147,26,0.06)]" />
          </div>
        )}

        {/* Idle state */}
        {status === "idle" && !showSnapshot && (
          <div className="absolute inset-0 rounded-lg bg-[#090c11]" />
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#090c11]">
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-600">
              Bitmap not found
            </span>
          </div>
        )}

        {/* Listing pill overlay */}
        {listingStatus && listingStatus !== "unlisted" && (
          <div className="absolute left-2 top-2">
            <StatusPill status={listingStatus} />
          </div>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-col gap-0.5 md:gap-1 px-2.5 py-2 md:px-3 md:py-3">
        {meta && (
          <div className="flex items-center justify-between">
            {meta.timestamp > 0 && (
              <span className="font-mono text-[10px] md:text-xs text-[rgba(255,255,255,0.5)]">
                {formatDate(meta.timestamp)}
              </span>
            )}
            {meta.tx_count > 0 && (
              <span className="font-mono text-[9px] md:text-[10px] text-[rgba(255,255,255,0.4)]">
                {meta.tx_count.toLocaleString()} txs
              </span>
            )}
            {meta.size > 0 && (
              <span className="font-mono text-[10px] md:text-xs text-[rgba(255,255,255,0.5)]">
                {formatSize(meta.size)}
              </span>
            )}
          </div>
        )}

        {price !== undefined && (
          <div className="mt-0.5 md:mt-1 border-t border-[rgba(255,255,255,0.08)] pt-1 md:pt-1">
            <PriceDisplay price={price} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
});
