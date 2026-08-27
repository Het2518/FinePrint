"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Bell, Zap, Settings, Shield, ChevronRight, LogOut
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contracts", icon: FileText, label: "Contracts" },
  { href: "/approvals", icon: Bell, label: "Approvals", badge: true },
  { href: "/actions", icon: Zap, label: "Actions" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("fineprint_token");
    router.push("/login");
  };


  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/[0.06] z-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white tracking-tight">FinePrint</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">AI Risk Monitor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={16} className={active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 pulse-soft" />
              )}
              {active && <ChevronRight size={14} className="text-indigo-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">Admin</p>
            <p className="text-[10px] text-slate-500 truncate">Org Admin</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-all"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

