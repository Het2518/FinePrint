"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; up: boolean };
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const duration = 600;
    const startTime = performance.now();
    const startValue = ref.current;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        ref.current = value;
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const isNumber = typeof value === "number";

  return (
    <div
      className="rounded-md p-5 transition-colors duration-150 animate-slide-up"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}
        </p>
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{
            background: "var(--accent-muted)",
            color: "var(--accent)",
          }}
        >
          {icon}
        </div>
      </div>

      <p
        className="text-2xl font-bold tracking-tight tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {isNumber ? <AnimatedNumber value={value} /> : value}
      </p>

      {subtitle && (
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className="text-xs font-medium"
            style={{
              color: trend.up ? "var(--status-success)" : "var(--status-danger)",
            }}
          >
            {trend.up ? "\u2191" : "\u2193"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
