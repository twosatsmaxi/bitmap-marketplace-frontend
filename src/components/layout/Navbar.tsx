"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Terminal, Menu, X, Wallet, User } from "lucide-react";
import { cn, truncateAddr } from "@/lib/utils";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WalletDropdown from "@/components/wallet/WalletDropdown";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { type WalletProvider } from "@/lib/wallet-service";
import { type Profile } from "@/lib/auth-api";
import WalletCommandPalette from "@/components/wallet/WalletCommandPalette";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isConnected, wallets, connect, connectAnother, isConnecting, error } = useWalletConnect();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<WalletProvider | null>(null);
  const [connectedProfile, setConnectedProfile] = useState<Profile | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Global Cmd+K / Ctrl+K shortcut for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleWalletSelect = async (provider: WalletProvider) => {
    setConnectingProvider(provider);
    const result = isConnected
      ? await connectAnother(provider)
      : await connect(provider);
    if (result) {
      setConnectedProfile(result.profile);
      setConnectedAddress(result.ordinalsAddress);
    }
    // Keep connectingProvider set so the connected screen can show the provider name
  };

  const handleGoToProfile = () => {
    setPaletteOpen(false);
    setConnectedProfile(null);
    setConnectingProvider(null);
    setConnectedAddress(null);
    router.push("/profile");
  };

  const handlePaletteClose = () => {
    setPaletteOpen(false);
    setConnectedProfile(null);
    setConnectingProvider(null);
    setConnectedAddress(null);
  };

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-nav items-center border-b border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.95)] px-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 md:gap-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 transition-colors">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-primary shadow-[0_0_15px_rgba(247,147,26,0.3)]">
              <Terminal className="h-4 w-4 text-black" strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base font-black uppercase tracking-[0.12em] text-primary md:text-xl">
                Bitmap
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 md:block">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1.5 md:flex">
            <NavLink href="/" active={pathname === "/" || pathname.startsWith("/explore")}>Explore</NavLink>
            <SoonNav label="Market" />
            <SoonNav label="Trade" />
            <SoonNav label="Activity" />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Trade — always visible on mobile */}
            <SoonNav label="Trade" className="md:hidden" />

            {/* Desktop: Wallet Connect */}
            <WalletDropdown onOpenPalette={() => setPaletteOpen(true)} />

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center active:scale-95 md:hidden px-0 py-0"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[280px] border-l border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-2xl transition-transform duration-300 ease-out md:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer Header */}
        <div className="flex h-nav items-center justify-between border-b border-[rgba(120,72,18,0.55)] px-4">
          <span className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-primary">
            Menu
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center border-none bg-transparent active:scale-95 px-0 py-0"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="flex flex-col gap-1 p-4">
          <DrawerNavLink
            href="/"
            active={pathname === "/" || pathname.startsWith("/explore")}
            onClick={() => setMenuOpen(false)}
          >
            Explore
          </DrawerNavLink>
          <DrawerSoonNav label="Market" />
          <DrawerSoonNav label="Activity" />

          <div className="my-4 border-t border-[rgba(120,72,18,0.45)]" />

          {/* Mobile Actions */}
          <div className="flex flex-col gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="h-1.5 w-1.5 flex-shrink-0 bg-primary" />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                  {truncateAddr(wallets[0]?.ordinalsAddress ?? "", 6, 4)}
                </span>
                {wallets.length > 1 && (
                  <Badge variant="soon">+{wallets.length - 1}</Badge>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setPaletteOpen(true);
                }}
                className="relative mx-4 flex animate-pulseGlow items-center justify-center gap-2 border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-bg shadow-glow transition-colors hover:bg-[rgba(247,147,26,0.88)]"
              >
                <Wallet className="h-3.5 w-3.5" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[rgba(120,72,18,0.45)] p-4 safe-area-inset-bottom">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            Bitmap Marketplace v0.1.0
          </p>
        </div>
      </div>

      {/* Command Palette (Cmd+K / Connect button / mobile) */}
      <WalletCommandPalette
        open={paletteOpen}
        onClose={handlePaletteClose}
        onSelect={handleWalletSelect}
        isConnecting={isConnecting}
        connectingProvider={connectingProvider}
        connectedProfile={connectedProfile}
        connectedAddress={connectedAddress}
        onGoToProfile={handleGoToProfile}
        error={error}
      />
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors",
        active
          ? "border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] text-primary"
          : "border-transparent text-zinc-500 hover:border-[rgba(120,72,18,0.55)] hover:bg-[rgba(247,147,26,0.06)] hover:text-primary"
      )}
    >
      {children}
    </Link>
  );
}

function SoonNav({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600", className)}>
      {label}
      <Badge variant="soon">Soon</Badge>
    </span>
  );
}

function DrawerNavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center rounded-md border-l-2 px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.18em] transition-all active:scale-[0.98]",
        active
          ? "border-primary bg-[rgba(247,147,26,0.08)] text-primary"
          : "border-transparent text-zinc-500 hover:border-primary/40 hover:bg-[rgba(247,147,26,0.04)] hover:text-zinc-300"
      )}
    >
      {children}
    </Link>
  );
}

function DrawerSoonNav({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border-l-2 border-transparent px-4 py-3.5">
      <span className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </span>
      <Badge variant="soon" className="font-bold">Soon</Badge>
    </div>
  );
}
