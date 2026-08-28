"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon, Search, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import { useTheme } from "@/components/ThemeProvider";

const PUBLIC_PATHS = ["/login"];

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Real-time contract risk intelligence" },
  "/contracts": { title: "Contracts", description: "Monitor and manage vendor contracts" },
  "/approvals": { title: "Approvals", description: "Review AI recommendations before action" },
  "/actions": { title: "Actions", description: "Draft execution and action audit" },
  "/activity": { title: "Activity", description: "Immutable audit trail" },
  "/settings": { title: "Settings", description: "Configure thresholds, connections, and preferences" },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const [checked, setChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fineprint_token");
    if (!isPublic && !token) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [pathname, isPublic, router]);

  // Login page: no shell
  if (isPublic) {
    return (
      <>
        <CommandPalette />
        {children}
      </>
    );
  }

  // Loading state
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full animate-spin-slow"
          style={{
            border: "2px solid var(--border-subtle)",
            borderTopColor: "var(--accent)",
          }}
        />
      </div>
    );
  }

  const pageInfo = PAGE_TITLES[pathname] || {
    title: "",
    description: "",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />
      <CommandPalette />

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? "64px" : "240px" }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between h-14 px-6 shrink-0"
          style={{
            background: "var(--bg-canvas)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Page context */}
          <div>
            {pageInfo.title && (
              <>
                <h1
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {pageInfo.title}
                </h1>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Search trigger */}
            <button
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true })
                );
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors duration-150"
              style={{
                color: "var(--text-tertiary)",
                background: "var(--bg-surface-raised)",
                border: "1px solid var(--border-subtle)",
              }}
              title="Search (Ctrl+K)"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Search</span>
              <kbd
                className="font-mono text-[10px] px-1 py-0.5 rounded ml-1 hidden sm:inline"
                style={{
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {typeof navigator !== "undefined" &&
                /Mac|iPod|iPhone|iPad/.test(navigator.platform)
                  ? "⌘K"
                  : "Ctrl+K"}
              </kbd>
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-md transition-colors duration-150"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-raised)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              title="Notifications"
            >
              <Bell size={16} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md transition-colors duration-150"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-raised)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 relative z-10">{children}</main>
      </div>
    </div>
  );
}
