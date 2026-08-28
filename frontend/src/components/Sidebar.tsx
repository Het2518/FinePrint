"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, Bell, Zap, Settings, Shield,
  LogOut, ChevronsLeft, ChevronsRight, Clock, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/contracts", icon: FileText, label: "Contracts" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/approvals", icon: Bell, label: "Approvals", badge: true },
      { href: "/actions", icon: Zap, label: "Actions" },
      { href: "/activity", icon: Clock, label: "Activity" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [userInitial, setUserInitial] = useState("A");
  const [userRole, setUserRole] = useState("Admin");

  // Load pending approval count and user info
  useEffect(() => {
    api.dashboardSummary()
      .then((d) => setPendingCount(d.pending_approvals ?? 0))
      .catch(() => {});
    api.me()
      .then((u) => {
        setUserInitial((u.email?.[0] ?? "A").toUpperCase());
        setUserRole(u.role ?? "Admin");
      })
      .catch(() => {});
  }, []);

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
              AI Contract Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-disabled)" }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, badge }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                const showBadge = badge && pendingCount > 0;

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
                    {active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                    <Icon size={16} style={{ color: active ? "var(--accent)" : "inherit", flexShrink: 0 }} />
                    {!collapsed && (
                      <span className="flex-1">{label}</span>
                    )}
                    {!collapsed && showBadge && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                        style={{
                          background: "var(--status-warning-muted)",
                          color: "var(--status-warning)",
                        }}
                      >
                        {pendingCount}
                      </span>
                    )}
                    {collapsed && showBadge && (
                      <span
                        className="absolute top-1 right-1 w-2 h-2 rounded-full"
                        style={{ background: "var(--status-warning)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-1" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-md transition-colors duration-150"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {/* User footer */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
          >
            {userInitial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {userRole}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-md transition-colors duration-150 shrink-0"
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
