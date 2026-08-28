"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, FileText, Bell, Zap, Settings, ArrowRight,
} from "lucide-react";

const ROUTES = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "Navigation" },
  { href: "/contracts", label: "Contracts", icon: FileText, group: "Navigation" },
  { href: "/approvals", label: "Approvals", icon: Bell, group: "Navigation" },
  { href: "/actions", label: "Actions", icon: Zap, group: "Navigation" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Navigation" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = ROUTES.filter(
    (r) => r.label.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: "var(--bg-overlay)" }}
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg animate-slide-up"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "var(--bg-surface-raised)",
              color: "var(--text-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p
              className="text-sm text-center py-6"
              style={{ color: "var(--text-tertiary)" }}
            >
              No results found
            </p>
          ) : (
            <>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Navigation
              </p>
              {filtered.map((route, idx) => {
                const Icon = route.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={route.href}
                    onClick={() => navigate(route.href)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors duration-100"
                    style={{
                      background: isSelected ? "var(--accent-muted)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Icon size={16} />
                    <span className="flex-1 text-left font-medium">{route.label}</span>
                    {isSelected && (
                      <ArrowRight size={14} style={{ color: "var(--accent)" }} />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-center gap-4 px-4 py-2.5 text-[11px]"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--text-disabled)",
          }}
        >
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> select
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
