"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { detectWallets, type WalletProvider } from "@/lib/wallet-service";
import { cn } from "@/lib/utils";

interface WalletCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProvider) => void;
  isConnecting: boolean;
  connectingProvider: WalletProvider | null;
  error: string | null;
}

const SPINNER_FRAMES = ["|", "/", "-", "\\"];

const PIXEL_RAIN = [
  { left: "8%",  size: "4px", duration: 6,  delay: 0 },
  { left: "24%", size: "3px", duration: 8,  delay: 1.2 },
  { left: "45%", size: "5px", duration: 7,  delay: 0.5 },
  { left: "62%", size: "3px", duration: 9,  delay: 2.1 },
  { left: "78%", size: "4px", duration: 6.5, delay: 0.8 },
  { left: "91%", size: "3px", duration: 7.5, delay: 1.8 },
];

export default function WalletCommandPalette({
  open,
  onClose,
  onSelect,
  isConnecting,
  connectingProvider,
  error,
}: WalletCommandPaletteProps) {
  const [wallets, setWallets] = useState(detectWallets());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  // Re-detect wallets when palette opens
  useEffect(() => {
    if (open) {
      setWallets(detectWallets());
      setSelectedIndex(0);
    }
  }, [open]);

  // ASCII spinner animation
  useEffect(() => {
    if (!isConnecting) return;
    const id = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 150);
    return () => clearInterval(id);
  }, [isConnecting]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

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
    },
    [open, wallets, selectedIndex, onClose, onSelect],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  // Terminal prompt content
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
        <span
          className="inline-block w-2 h-4 bg-primary ml-0.5"
          style={{ animation: "blink 1s step-end infinite" }}
        />
      </>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Palette */}
      <div
        className={cn(
          "relative mt-24 h-fit w-[420px] max-w-[calc(100vw-2rem)]",
          "border border-[rgba(120,72,18,0.55)]",
          "bg-[rgba(7,7,9,0.98)]",
          "shadow-[0_0_60px_rgba(247,147,26,0.08)]",
          "animate-fadeUp overflow-hidden",
        )}
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,187,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,187,0,0.045) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Pixel rain */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {PIXEL_RAIN.map((p, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                background: "rgba(247, 147, 26, 0.12)",
                outline: "1px solid rgba(126, 73, 18, 0.24)",
                animation: `home-pixel-rain ${p.duration}s linear ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Terminal Prompt Line */}
        <div className="px-4 py-3 border-b border-[rgba(120,72,18,0.35)]">
          {promptContent}
        </div>

        {/* Wallet List */}
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
                    <span className="text-emerald-500">██</span>
                  ) : (
                    <span className="text-zinc-600">██</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgba(120,72,18,0.25)] px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-600">
            {"↑↓ navigate · enter select · esc close"}
          </span>
        </div>
      </div>

      {/* Blink keyframes */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
