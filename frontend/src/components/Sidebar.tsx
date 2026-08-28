"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, FileText, Bell, Zap, Settings, Shield,
  LogOut, ChevronsLeft, ChevronsRight,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contracts", icon: FileText, label: "Contracts" },
  { href: "/approvals", icon: Bell, label: "Approvals" },
  { href: "/actions", icon: Zap, label: "Actions" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("fineprint_token");
    router.push("/login");
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-200"
      style={{
        width: collapsed ? "64px" : "240px",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 h-14 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "var(--accent-muted)" }}
        >
          <Shield size={16} style={{ color: "var(--accent)" }} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
              FinePrint
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              AI Risk Monitor
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150"
              style={{
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "var(--sidebar-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--sidebar-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Icon size={18} style={{ color: active ? "var(--accent)" : "inherit" }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-1" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-md transition-colors duration-150"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sidebar-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {/* Footer — user */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            A
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                Admin
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                Org Admin
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-md transition-colors duration-150"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--sidebar-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "transparent";
            }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
