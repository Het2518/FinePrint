type Severity = "high" | "medium" | "low" | "none" | string;

const config: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  high: {
    label: "High Risk",
    color: "var(--status-danger)",
    bg: "var(--status-danger-muted)",
    border: "var(--status-danger-border)",
    dot: "var(--status-danger)",
  },
  medium: {
    label: "Medium Risk",
    color: "var(--status-warning)",
    bg: "var(--status-warning-muted)",
    border: "var(--status-warning-border)",
    dot: "var(--status-warning)",
  },
  low: {
    label: "Low Risk",
    color: "var(--status-success)",
    bg: "var(--status-success-muted)",
    border: "var(--status-success-border)",
    dot: "var(--status-success)",
  },
  none: {
    label: "No Risk",
    color: "var(--status-neutral)",
    bg: "var(--status-neutral-muted)",
    border: "var(--status-neutral-border)",
    dot: "var(--status-neutral)",
  },
};

export default function RiskBadge({ level }: { level: Severity }) {
  const c = config[level] ?? config.none;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
      style={{
        color: c.color,
        background: c.bg,
      }}
    >
      <span
        className={level === "high" ? "animate-pulse-glow" : ""}
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
        }}
      />
      {c.label}
    </span>
  );
}
