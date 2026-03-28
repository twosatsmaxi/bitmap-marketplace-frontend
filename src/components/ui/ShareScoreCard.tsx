"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Download, Share2 } from "lucide-react";
import {
  generateScoreCard,
  downloadScoreCard,
  copyScoreCardToClipboard,
  openTwitterIntent,
  nativeShare,
  type ScoreCardStat,
} from "@/lib/scorecard";

interface ShareScoreCardProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  stats: ScoreCardStat[];
  blockHeight: number;
  sceneCapture: string;
  isHighScore?: boolean;
  tweetText: string;
}

export function ShareScoreCard({
  isOpen,
  onClose,
  gameName,
  stats,
  blockHeight,
  sceneCapture,
  isHighScore,
  tweetText,
}: ShareScoreCardProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate score card when opened
  useEffect(() => {
    if (!isOpen || !sceneCapture) return;
    let cancelled = false;

    generateScoreCard({ gameName, sceneCapture, stats, blockHeight, isHighScore }).then(
      (canvas) => {
        if (cancelled) return;
        canvasRef.current = canvas;
        setImgSrc(canvas.toDataURL("image/png"));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isOpen, sceneCapture, gameName, stats, blockHeight, isHighScore]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setImgSrc(null);
      setStatus(null);
      canvasRef.current = null;
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const slug = gameName.toLowerCase().replace(/\s+/g, "-");
    downloadScoreCard(canvasRef.current, `${slug}-block-${blockHeight}.png`);
    setStatus("Saved!");
    setTimeout(() => setStatus(null), 2000);
  }, [gameName, blockHeight]);

  const handleShare = useCallback(async () => {
    if (!canvasRef.current) return;

    // On mobile, try native share first (can attach image directly to X)
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile) {
      const shared = await nativeShare(canvasRef.current, tweetText);
      if (shared) {
        setStatus("Shared!");
        setTimeout(() => setStatus(null), 2000);
        return;
      }
    }

    // Desktop: copy image to clipboard, then open Twitter intent
    const copied = await copyScoreCardToClipboard(canvasRef.current);
    if (copied) {
      setStatus("Image copied! Paste it in your tweet");
    } else {
      // Last resort: auto-download the image, then open intent
      const slug = gameName.toLowerCase().replace(/\s+/g, "-");
      downloadScoreCard(canvasRef.current, `${slug}-block-${blockHeight}.png`);
      setStatus("Image saved! Attach it to your tweet");
    }
    openTwitterIntent(tweetText);
    setTimeout(() => setStatus(null), 4000);
  }, [tweetText, gameName, blockHeight]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 mx-4 w-full max-w-[640px] br-card bg-[rgba(7,7,9,0.98)] p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-primary mb-4">
          Share Score
        </h2>

        {/* Preview */}
        <div className="mb-4 overflow-hidden" style={{ aspectRatio: "1200/630" }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Score card"
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <span className="font-mono text-xs text-zinc-500">Generating...</span>
            </div>
          )}
        </div>

        {/* Status message */}
        {status && (
          <p className="font-mono text-xs text-primary mb-3 text-center">{status}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDownload}
            disabled={!imgSrc}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 text-zinc-200 font-mono font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            DOWNLOAD
          </button>
          <button
            onClick={handleShare}
            disabled={!imgSrc}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-mono font-bold text-sm hover:bg-primary/80 transition-colors disabled:opacity-40"
          >
            <Share2 className="h-4 w-4" />
            SHARE ON X
          </button>
        </div>
      </div>
    </div>
  );
}
