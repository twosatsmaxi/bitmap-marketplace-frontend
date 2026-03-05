import Link from "next/link";
import { Search, Wallet } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-nav bg-bg/90 backdrop-blur border-b border-border z-50 flex items-center px-6">
      <div className="flex items-center gap-8 w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight text-primary">
          <div className="w-6 h-6 bg-primary rounded-sm" />
          BITMAP
        </Link>
        
        <div className="flex items-center gap-6 ml-4">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Browse
          </Link>
          <Link href="/activity" className="text-sm font-medium hover:text-primary transition-colors">
            Activity
          </Link>
          <Link href="/analytics" className="text-sm font-medium hover:text-primary transition-colors">
            Analytics
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-secondary" />
            </div>
            <input 
              type="text" 
              placeholder="Search by block number..."
              className="bg-surface border border-border rounded px-4 py-1.5 pl-9 text-sm focus:outline-none focus:border-primary w-64 transition-colors placeholder:text-text-secondary/50"
            />
          </div>
          
          <button className="flex items-center gap-2 bg-surface hover:bg-surface/80 border border-border px-4 py-1.5 rounded text-sm font-semibold transition-colors">
            <Wallet className="h-4 w-4" />
            Connect
          </button>
        </div>
      </div>
    </nav>
  );
}
