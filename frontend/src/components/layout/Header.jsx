import { Search, Bell, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function Header({ session }) {
  return (
    <header className="h-16 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-white/5 rounded-lg leading-5 bg-zinc-800/50 text-zinc-300 placeholder-slate-500 focus:outline-none focus:bg-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 sm:text-sm transition-all"
            placeholder="Search portfolios, transactions... (Cmd+K)"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
          API Live
        </div>

        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-orange-500 ring-2 ring-slate-900"></span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-2"></div>

        <button 
          onClick={() => supabase.auth.signOut()}
          className="flex items-center text-sm text-zinc-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

