import Link from "next/link";
import { Search, Wallet, Terminal } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-nav items-center border-b border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.92)] px-4 backdrop-blur-md md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 md:gap-8">
        <Link href="/" className="group flex items-center gap-3 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center bg-primary shadow-[0_0_15px_rgba(247,147,26,0.3)]">
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
          <span className="hidden lg:inline-block border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.06)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Index
          </span>
        </Link>
        
        <div className="ml-1 hidden items-center gap-2 md:flex">
          <NavLink href="/">Market</NavLink>
          <NavLink href="/browse">Browse</NavLink>
          <NavLink href="/activity">Activity</NavLink>
          <NavLink href="/analytics">Analytics</NavLink>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Query block..."
              className="w-40 border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-3 py-2 pl-9 font-mono text-xs uppercase tracking-[0.14em] text-zinc-300 transition-colors placeholder:text-zinc-600 focus:border-primary focus:outline-none md:w-64"
            />
          </div>

          <button className="flex items-center gap-2 border border-[rgba(247,147,26,0.45)] bg-[rgba(247,147,26,0.16)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-[rgba(247,147,26,0.24)]">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border border-transparent px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-[rgba(120,72,18,0.55)] hover:bg-[rgba(247,147,26,0.06)] hover:text-primary"
    >
      {children}
    </Link>
  );
}
