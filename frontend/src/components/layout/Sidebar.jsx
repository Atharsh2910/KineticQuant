import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, ArrowRightLeft, Target, Settings, Building2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Portfolio", href: "/portfolio" },
  { icon: ArrowRightLeft, label: "Transactions", href: "/transactions" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-white/5 bg-zinc-900/40 backdrop-blur-xl flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Building2 className="w-6 h-6 text-orange-500 mr-2" />
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          KineticQuant
        </span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group overflow-hidden",
                isActive ? "text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 mr-3 relative z-10", isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-300")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="glass-card rounded-lg p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-orange-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-900/50">
            PR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Principal</p>
            <p className="text-xs text-zinc-400 truncate">Tier: Enterprise</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

