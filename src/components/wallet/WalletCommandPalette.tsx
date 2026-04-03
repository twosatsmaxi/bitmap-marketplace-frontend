"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { detectWallets, type WalletProvider } from "@/lib/wallet-service";
import { type Profile } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

interface WalletCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProvider) => void;
  isConnecting: boolean;
  connectingProvider: WalletProvider | null;
  connectedProfile: Profile | null;
  onGoToPortfolio: () => void;
  error: string | null;
}

/* ── Terminal boot sequence types ─────────────────────────── */

interface TerminalLine {
  prefix: string;
  value: string;
  color: string;       // tailwind class for value portion
  speed: number;       // ms per character
  pauseAfter: number;  // ms delay before next line starts
  isAsync?: boolean;   // true = waits for bitmapCount
}

interface DisplayLine {
  prefix: string;
  value: string;
  color: string;
  done: boolean;
  showShimmer?: boolean;
}

type TraitInfo = { name: string; count: number };

function formatBitmapValue(bitmapCount: number, traits: TraitInfo[]): string {
  const countStr = bitmapCount.toLocaleString("en-US");
  if (traits.length === 0) return countStr;
  const showTotal = Math.random() > 0.5;
  if (showTotal) return `${countStr} (${traits.length} traits found)`;
  const random = traits[Math.floor(Math.random() * traits.length)];
  return `${countStr} (${random.count} ${random.name} found)`;
}

function buildSequence(
  provider: string,
  address: string,
  bitmapCount: number | null,
  traits: TraitInfo[],
): TerminalLine[] {
  const short = address.length > 16
    ? address.slice(0, 8) + "…" + address.slice(-6)
    : address;

  const bitmapValue = bitmapCount !== null
    ? formatBitmapValue(bitmapCount, traits)
    : "";

  return [
    { prefix: "> ",           value: `connecting ${provider}...`, color: "text-primary",           speed: 28, pauseAfter: 200 },
    { prefix: "  auth      ", value: "ok",                        color: "text-primary",           speed: 18, pauseAfter: 100 },
    { prefix: "  network   ", value: "mainnet",                   color: "text-amber-700",         speed: 18, pauseAfter: 100 },
    { prefix: "  addr      ", value: short,                       color: "text-amber-700",         speed: 12, pauseAfter: 100 },
    { prefix: "  bitmaps   ", value: bitmapValue, color: "text-primary font-bold", speed: 22, pauseAfter: 120, isAsync: bitmapCount === null },
    { prefix: "  status    ", value: "ready",                     color: "text-primary",           speed: 22, pauseAfter: 250 },
    { prefix: "> ",           value: "enter portfolio",           color: "text-amber-200",         speed: 25, pauseAfter: 0 },
  ];
}

/* ── Constants ────────────────────────────────────────────── */

const SPINNER_FRAMES = ["|", "/", "-", "\\"];

const PIXEL_RAIN = [
  { left: "8%",  size: "4px", duration: 6,  delay: 0 },
  { left: "24%", size: "3px", duration: 8,  delay: 1.2 },
  { left: "45%", size: "5px", duration: 7,  delay: 0.5 },
  { left: "62%", size: "3px", duration: 9,  delay: 2.1 },
  { left: "78%", size: "4px", duration: 6.5, delay: 0.8 },
  { left: "91%", size: "3px", duration: 7.5, delay: 1.8 },
];

const GRID_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,187,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,187,0,0.045) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;

const PIXEL_STYLES = PIXEL_RAIN.map((p) => ({
  left: p.left,
  width: p.size,
  height: p.size,
  background: "rgba(247, 147, 26, 0.12)",
  outline: "1px solid rgba(126, 73, 18, 0.24)",
  animation: `home-pixel-rain ${p.duration}s linear ${p.delay}s infinite`,
}));

/* ── Component ────────────────────────────────────────────── */

export default function WalletCommandPalette({
  open,
  onClose,
  onSelect,
  isConnecting,
  connectingProvider,
  connectedProfile,
  onGoToPortfolio,
  error,
}: WalletCommandPaletteProps) {
  const [wallets, setWallets] = useState(() => detectWallets());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [bitmapCount, setBitmapCount] = useState<number | null>(null);
  const [traits, setTraits] = useState<TraitInfo[]>([]);

  // Terminal boot sequence state
  const [displayLines, setDisplayLines] = useState<DisplayLine[]>([]);
  const [activeLineIdx, setActiveLineIdx] = useState(-1);
  const [sequenceDone, setSequenceDone] = useState(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const bitmapCountRef = useRef<number | null>(null);
  bitmapCountRef.current = bitmapCount;
  const traitsRef = useRef<TraitInfo[]>([]);
  traitsRef.current = traits;

  // Refs for stable keyboard handler
  const stateRef = useRef({ wallets, selectedIndex, onClose, onSelect, onGoToPortfolio, open, connectedProfile });
  stateRef.current = { wallets, selectedIndex, onClose, onSelect, onGoToPortfolio, open, connectedProfile };

  // Reset on open
  useEffect(() => {
    if (open) {
      setWallets(detectWallets());
      setSelectedIndex(0);
      setBitmapCount(null);
      setTraits([]);
      setDisplayLines([]);
      setActiveLineIdx(-1);
      setSequenceDone(false);
      resumeRef.current = null;
    }
  }, [open]);

  // Spinner for connecting state
  useEffect(() => {
    if (!isConnecting) return;
    const id = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 150);
    return () => clearInterval(id);
  }, [isConnecting]);

  // Fetch bitmap count when connected
  useEffect(() => {
    if (!connectedProfile) {
      setBitmapCount(null);
      setTraits([]);
      return;
    }
    let stale = false;
    const addresses = connectedProfile.wallets.map((w) => w.ordinalsAddress);
    fetch("/api/portfolio/multi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (stale) return;
        setBitmapCount(data.total ?? 0);
        const traitStats = (data.traits as TraitInfo[] | undefined) ?? [];
        setTraits(traitStats);
      })
      .catch(() => {
        if (stale) return;
        setBitmapCount(0);
        setTraits([]);
      });
    return () => { stale = true; };
  }, [connectedProfile]);

  // Terminal boot sequence engine
  const runSequence = useCallback((sequence: TerminalLine[]) => {
    const cancel = { cancelled: false };
    cancelRef.current = cancel;

    function typeLine(lineIdx: number) {
      if (cancel.cancelled || lineIdx >= sequence.length) {
        if (!cancel.cancelled) setSequenceDone(true);
        return;
      }

      const line = sequence[lineIdx];
      const fullText = line.prefix + line.value;

      // Add empty display line
      setDisplayLines((prev) => [
        ...prev,
        { prefix: "", value: "", color: line.color, done: false },
      ]);
      setActiveLineIdx(lineIdx);

      // Handle async line (bitmaps)
      if (line.isAsync) {
        // Type prefix first, then check if data arrived in the meantime
        let ci = 0;
        function tickPrefix() {
          if (cancel.cancelled) return;
          ci++;
          const visible = line.prefix.slice(0, ci);
          setDisplayLines((prev) => {
            const next = [...prev];
            next[lineIdx] = { ...next[lineIdx], prefix: visible };
            return next;
          });
          if (ci < line.prefix.length) {
            setTimeout(tickPrefix, line.speed);
          } else {
            // Prefix done — check if count already arrived
            const count = bitmapCountRef.current;
            if (count !== null) {
              // Data already here — type the value normally
              const val = formatBitmapValue(count, traitsRef.current);
              let vi = 0;
              function tickValue() {
                if (cancel.cancelled) return;
                vi++;
                setDisplayLines((prev) => {
                  const next = [...prev];
                  next[lineIdx] = { ...next[lineIdx], value: val.slice(0, vi) };
                  return next;
                });
                if (vi < val.length) {
                  setTimeout(tickValue, line.speed);
                } else {
                  setDisplayLines((prev) => {
                    const next = [...prev];
                    next[lineIdx] = { ...next[lineIdx], done: true };
                    return next;
                  });
                  setTimeout(() => typeLine(lineIdx + 1), line.pauseAfter);
                }
              }
              tickValue();
            } else {
              // Data not here yet — show shimmer and wait
              setDisplayLines((prev) => {
                const next = [...prev];
                next[lineIdx] = { ...next[lineIdx], showShimmer: true };
                return next;
              });
              resumeRef.current = () => {
                resumeRef.current = null;
                setTimeout(() => typeLine(lineIdx + 1), line.pauseAfter);
              };
            }
          }
        }
        tickPrefix();
        return;
      }

      // Normal line: type chars one by one across prefix+value
      let ci = 0;
      function tick() {
        if (cancel.cancelled) return;
        ci++;
        const prefixLen = line.prefix.length;
        const visiblePrefix = fullText.slice(0, Math.min(ci, prefixLen));
        const visibleValue = ci > prefixLen ? line.value.slice(0, ci - prefixLen) : "";
        setDisplayLines((prev) => {
          const next = [...prev];
          next[lineIdx] = { ...next[lineIdx], prefix: visiblePrefix, value: visibleValue };
          return next;
        });
        if (ci < fullText.length) {
          setTimeout(tick, line.speed);
        } else {
          // Line done
          setDisplayLines((prev) => {
            const next = [...prev];
            next[lineIdx] = { ...next[lineIdx], done: true };
            return next;
          });
          setTimeout(() => typeLine(lineIdx + 1), line.pauseAfter);
        }
      }
      tick();
    }

    typeLine(0);
    return () => { cancel.cancelled = true; };
  }, []);

  // Start sequence when connected
  useEffect(() => {
    if (!connectedProfile) {
      setDisplayLines([]);
      setActiveLineIdx(-1);
      setSequenceDone(false);
      resumeRef.current = null;
      return;
    }
    // Clear any leftover state from a prior run (e.g. StrictMode double-invoke)
    setDisplayLines([]);
    setActiveLineIdx(-1);
    setSequenceDone(false);

    const primaryWallet = connectedProfile.wallets[0];
    const provider = connectingProvider ?? primaryWallet?.label ?? "wallet";
    const addr = primaryWallet?.ordinalsAddress ?? connectedProfile.primaryAddress;
    const sequence = buildSequence(provider, addr, bitmapCount, traits);
    return runSequence(sequence);
  }, [connectedProfile, connectingProvider, runSequence]); // intentionally exclude bitmapCount/traits — handled separately

  // Handle late-arriving bitmap count
  useEffect(() => {
    if (bitmapCount === null) return;
    // Find the async line and fill it in
    setDisplayLines((prev) => {
      const idx = prev.findIndex((l) => l.showShimmer);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        value: formatBitmapValue(bitmapCount, traits),
        showShimmer: false,
        done: true,
      };
      return next;
    });
    // Resume the sequence if paused
    if (resumeRef.current) {
      resumeRef.current();
    }
  }, [bitmapCount, traits]);

  // Keyboard handler
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      const { wallets, selectedIndex, onClose, onSelect, onGoToPortfolio, connectedProfile } = stateRef.current;

      if (connectedProfile) {
        if (e.key === "Enter") {
          e.preventDefault();
          onGoToPortfolio();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev === 0 ? wallets.length - 1 : prev - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev === wallets.length - 1 ? 0 : prev + 1));
          break;
        case "Enter":
          e.preventDefault();
          if (wallets[selectedIndex]?.installed) {
            onSelect(wallets[selectedIndex].provider);
          }
          break;
        case "1":
          e.preventDefault();
          if (wallets[0]?.installed) {
            setSelectedIndex(0);
            onSelect(wallets[0].provider);
          }
          break;
        case "2":
          e.preventDefault();
          if (wallets[1]?.installed) {
            setSelectedIndex(1);
            onSelect(wallets[1].provider);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  /* ── Connected: terminal boot sequence ─────────────────── */
  if (connectedProfile) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div
          className={cn(
            "relative mt-24 h-fit w-[420px] max-w-[calc(100vw-2rem)]",
            "border border-[rgba(120,72,18,0.55)]",
            "bg-[rgba(7,7,9,0.98)]",
            "shadow-[0_0_60px_rgba(247,147,26,0.08)]",
            "animate-fadeUp overflow-hidden",
          )}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={GRID_STYLE} />
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {PIXEL_STYLES.map((style, i) => (
              <span key={i} className="absolute" style={style} />
            ))}
          </div>

          {/* Terminal lines */}
          <div
            className={cn("px-4 py-4 font-mono text-sm space-y-0.5 min-h-[160px]", sequenceDone && "cursor-pointer")}
            onClick={sequenceDone ? onGoToPortfolio : undefined}
            role={sequenceDone ? "button" : undefined}
            tabIndex={sequenceDone ? 0 : undefined}
          >
            {displayLines.map((line, i) => {
              const isActive = i === activeLineIdx && !line.done;
              return (
                <div key={i} className="flex items-center h-5">
                  <span className="text-amber-900/70 whitespace-pre">{line.prefix}</span>
                  <span className={cn(line.color, "whitespace-pre")}>{line.value}</span>
                  {line.showShimmer && (
                    <span className="inline-block h-3.5 w-14 animate-shimmer rounded-sm bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
                  )}
                  {isActive && !line.showShimmer && (
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-px animate-[blink_1s_step-end_infinite]" />
                  )}
                </div>
              );
            })}
            {/* Blinking cursor after CTA line */}
            {sequenceDone && (
              <span className="inline-block w-1.5 h-3.5 bg-primary animate-[blink_1s_step-end_infinite]" />
            )}
          </div>

          {/* Footer */}
          {sequenceDone && (
            <div className="border-t border-[rgba(120,72,18,0.25)] px-4 py-2 animate-fadeUp flex gap-1">
              <button
                type="button"
                onClick={onGoToPortfolio}
                className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.14em] hover:text-primary transition-colors"
              >
                enter portfolio
              </button>
              <span className="font-mono text-[10px] text-zinc-600">·</span>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.14em] hover:text-primary transition-colors"
              >
                esc close
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  /* ── Default: wallet selection screen ──────────────────── */
  let promptContent: React.ReactNode;
  if (error) {
    promptContent = (
      <span className="font-mono text-sm text-red-400">{`> ERR: ${error}`}</span>
    );
  } else if (isConnecting) {
    promptContent = (
      <>
        <span className="font-mono text-sm text-primary">{"> connect_wallet"}</span>
        <span className="font-mono text-sm text-primary ml-1">
          {SPINNER_FRAMES[spinnerFrame]}
        </span>
      </>
    );
  } else {
    promptContent = (
      <>
        <span className="font-mono text-sm text-primary">{"> connect_wallet"}</span>
        <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-[blink_1s_step-end_infinite]" />
      </>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "relative mt-24 h-fit w-[420px] max-w-[calc(100vw-2rem)]",
          "border border-[rgba(120,72,18,0.55)]",
          "bg-[rgba(7,7,9,0.98)]",
          "shadow-[0_0_60px_rgba(247,147,26,0.08)]",
          "animate-fadeUp overflow-hidden",
        )}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={GRID_STYLE} />
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {PIXEL_STYLES.map((style, i) => (
            <span key={i} className="absolute" style={style} />
          ))}
        </div>

        <div className="px-4 py-3 border-b border-[rgba(120,72,18,0.35)]">
          {promptContent}
        </div>

        <div className="p-2">
          {wallets.map((wallet, index) => {
            const isSelected = index === selectedIndex;
            const isWalletConnecting =
              isConnecting && connectingProvider === wallet.provider;

            return (
              <button
                key={wallet.provider}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 font-mono text-sm transition-all",
                  isSelected
                    ? "bg-[rgba(247,147,26,0.08)] text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300",
                  !wallet.installed && "opacity-50 cursor-not-allowed",
                )}
                disabled={!wallet.installed}
                onClick={() => {
                  if (wallet.installed) {
                    setSelectedIndex(index);
                    onSelect(wallet.provider);
                  }
                }}
              >
                <span className="text-primary">
                  {isSelected ? ">" : "\u00A0"}
                </span>
                <span className="text-zinc-600 text-xs">[{index + 1}]</span>
                <span className="text-sm">
                  {wallet.provider}
                </span>
                <span className="ml-auto">
                  {isWalletConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : wallet.installed ? (
                    <span className="h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  ) : (
                    <span className="h-2.5 w-2.5 bg-zinc-700" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[rgba(120,72,18,0.25)] px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-600">
            {"↑↓ navigate · enter select · esc close"}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
