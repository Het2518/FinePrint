"use client";

type StatusVariant =
  | "active"
  | "scanning"
  | "pending"
  | "approved"
  | "rejected"
  | "auto_approved"
  | "draft"
  | "sent"
  | "cancelled"
  | "parse_failed"
  | "manual_review"
  | "archived"
  | "connected"
  | "disconnected"
  | "expired"
  | string;

const VARIANT_STYLES: Record<string, { color: string; bg: string; dot?: string }> = {
  active:        { color: "var(--status-success)",  bg: "var(--status-success-muted)",  dot: "var(--status-success)" },
  connected:     { color: "var(--status-success)",  bg: "var(--status-success-muted)",  dot: "var(--status-success)" },
  approved:      { color: "var(--status-success)",  bg: "var(--status-success-muted)",  dot: "var(--status-success)" },
  auto_approved: { color: "var(--status-success)",  bg: "var(--status-success-muted)",  dot: "var(--status-success)" },
  sent:          { color: "var(--status-success)",  bg: "var(--status-success-muted)",  dot: "var(--status-success)" },

  scanning:      { color: "var(--accent)",           bg: "var(--accent-muted)",          dot: "var(--accent)" },
  pending:       { color: "var(--status-warning)",  bg: "var(--status-warning-muted)",  dot: "var(--status-warning)" },
  draft:         { color: "var(--status-warning)",  bg: "var(--status-warning-muted)",  dot: "var(--status-warning)" },
  manual_review: { color: "var(--status-warning)",  bg: "var(--status-warning-muted)",  dot: "var(--status-warning)" },

  rejected:      { color: "var(--status-danger)",   bg: "var(--status-danger-muted)",   dot: "var(--status-danger)" },
  parse_failed:  { color: "var(--status-danger)",   bg: "var(--status-danger-muted)",   dot: "var(--status-danger)" },
  expired:       { color: "var(--status-danger)",   bg: "var(--status-danger-muted)",   dot: "var(--status-danger)" },

  archived:      { color: "var(--status-neutral)",  bg: "var(--status-neutral-muted)",  dot: "var(--status-neutral)" },
  cancelled:     { color: "var(--status-neutral)",  bg: "var(--status-neutral-muted)",  dot: "var(--status-neutral)" },
  disconnected:  { color: "var(--status-neutral)",  bg: "var(--status-neutral-muted)",  dot: "var(--status-neutral)" },
};

function getStyle(variant: string) {
  return VARIANT_STYLES[variant] ?? {
    color: "var(--text-secondary)",
    bg: "var(--bg-surface-raised)",
    dot: "var(--text-disabled)",
  };
}

function labelFor(variant: string): string {
  return variant.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  showDot?: boolean;
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  label,
  showDot = true,
  size = "sm",
}: StatusBadgeProps) {
  const style = getStyle(status);
  const isScanning = status === "scanning";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium capitalize ${
        size === "sm" ? "text-xs px-2 py-0.5 rounded" : "text-sm px-2.5 py-1 rounded-md"
      }`}
      style={{ color: style.color, background: style.bg }}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isScanning ? "animate-pulse-glow" : ""
          }`}
          style={{ background: style.dot }}
        />
      )}
      {label ?? labelFor(status)}
    </span>
  );
}
