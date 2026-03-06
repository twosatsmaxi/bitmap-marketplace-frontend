"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Terminal, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-nav items-center border-b border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.92)] px-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 md:gap-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 transition-colors">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-primary shadow-[0_0_15px_rgba(247,147,26,0.3)]">
              <Terminal className="h-4 w-4 text-black" strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-black uppercase tracking-[0.12em] text-primary md:text-xl">
                Bitmap
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 md:block">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="ml-1 hidden items-center gap-2 md:flex">
            <NavLink href="/" active={pathname === "/"}>Market</NavLink>
            <SoonNav label="Trade" />
            <SoonNav label="Activity" />
            <SoonNav label="Analytics" />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Trade — always visible on mobile */}
            <SoonNavInline label="Trade" className="md:hidden" />

            {/* Desktop: Query + Connect */}
            <span className="hidden items-center gap-2 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 sm:hidden md:inline-flex">
              <Search className="h-3.5 w-3.5" />
              Query
              <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
                Soon
              </span>
            </span>
            <span className="hidden items-center gap-2 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 md:inline-flex">
              Connect
              <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
                Soon
              </span>
            </span>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.06)] text-zinc-400 transition-colors hover:text-primary md:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed left-0 right-0 top-nav z-40 border-b border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.97)] px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <MobileNavLink href="/" active={pathname === "/"} onClick={() => setMenuOpen(false)}>
              Market
            </MobileNavLink>
            <MobileSoonNav label="Activity" />
            <MobileSoonNav label="Analytics" />
            <div className="mt-2 border-t border-[rgba(120,72,18,0.45)] pt-2">
              <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
                Connect
                <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
                  Soon
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
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

function SoonNav({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
      {label}
      <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
        Soon
      </span>
    </span>
  );
}

function SoonNavInline({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600", className)}>
      {label}
      <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
        Soon
      </span>
    </span>
  );
}

function MobileNavLink({
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
        "flex items-center border-l-2 px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.18em] transition-colors",
        active
          ? "border-primary bg-[rgba(247,147,26,0.06)] text-primary"
          : "border-transparent text-zinc-500 hover:border-primary/40 hover:text-zinc-300"
      )}
    >
      {children}
    </Link>
  );
}

function MobileSoonNav({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-l-2 border-transparent px-4 py-3">
      <span className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </span>
      <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-primary">
        Soon
      </span>
    </div>
  );
}
