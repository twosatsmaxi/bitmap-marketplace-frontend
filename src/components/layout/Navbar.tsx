import Link from "next/link";
import { Search, Wallet, Terminal } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-nav bg-bg/90 backdrop-blur-md border-b border-border z-50 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-8 w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 font-heading font-bold text-lg md:text-xl tracking-tight text-text-primary hover:text-primary transition-colors">
          <div className="w-8 h-8 border border-primary bg-primary-muted pixel-cut flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Terminal className="w-4 h-4 text-primary relative z-10" />
          </div>
          <span className="tracking-widest">BITMAP</span>
          <span className="hidden lg:inline-block text-[10px] px-2 py-1 bg-surface-2 text-text-secondary font-mono uppercase tracking-[0.2em] border border-border pixel-cut-sm">
            INDEX
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 ml-2 font-mono text-xs uppercase tracking-widest">
          <Link href="/" className="text-text-secondary hover:text-primary transition-colors">
            Browse
          </Link>
          <Link href="/activity" className="text-text-secondary hover:text-primary transition-colors">
            Activity
          </Link>
          <Link href="/analytics" className="text-text-secondary hover:text-primary transition-colors">
            Analytics
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Query block..."
              className="bg-surface-2 border border-border px-3 py-1.5 pl-9 text-xs font-mono focus:outline-none focus:border-primary w-40 md:w-64 transition-colors placeholder:text-text-secondary/50 pixel-cut-sm"
            />
          </div>
          
          <button className="pixel-cut flex items-center gap-2 bg-primary-muted hover:bg-primary/20 border border-primary/50 px-4 py-1.5 text-xs font-mono text-primary font-bold uppercase tracking-widest transition-all">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
