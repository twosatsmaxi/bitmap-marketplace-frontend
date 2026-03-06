import Link from "next/link";
import { Search, Terminal } from "lucide-react";

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
        </Link>
        
        <div className="ml-1 hidden items-center gap-2 md:flex">
          <NavLink href="/">Market</NavLink>
          <SoonNav label="Trade" />
          <SoonNav label="Activity" />
          <SoonNav label="Analytics" />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 sm:inline-flex">
            <Search className="h-3.5 w-3.5" />
            Query
            <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
              Soon
            </span>
          </span>

          <span className="inline-flex items-center gap-2 border border-[rgba(120,72,18,0.4)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
            Connect
            <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">
              Soon
            </span>
          </span>
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
