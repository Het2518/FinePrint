"use client";

interface RiskMeterProps {
  confidence: number | null | undefined; // 0–1
  threshold?: number; // 0–1, default 0.6
  riskLevel?: "low" | "medium" | "high" | string | null;
  compact?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  low:    "var(--status-success)",
  medium: "var(--status-warning)",
  high:   "var(--status-danger)",
};

export default function RiskMeter({
  confidence,
  threshold = 0.6,
  riskLevel,
  compact = false,
}: RiskMeterProps) {
  const pct = confidence != null ? Math.min(Math.max(confidence, 0), 1) * 100 : null;
  const thresholdPct = threshold * 100;
  const passed = pct != null ? pct >= thresholdPct : null;
  const riskColor = riskLevel ? RISK_COLORS[riskLevel] ?? "var(--text-secondary)" : "var(--accent)";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-surface-raised)" }}
        >
          {pct != null && (
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: riskColor }}
            />
          )}
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {pct != null ? `${Math.round(pct)}%` : "—"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          AI Confidence
        </span>
        {riskLevel && (
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: riskColor }}
          >
            {riskLevel} RISK
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-canvas)" }}>
        {pct != null && (
          <div
            className="h-full rounded-full animate-gauge-fill"
            style={{ width: `${pct}%`, background: riskColor }}
          />
        )}
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5"
          style={{
            left: `${thresholdPct}%`,
            background: "var(--border-default)",
          }}
          title={`Required threshold: ${Math.round(thresholdPct)}%`}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-mono tabular-nums">
        <span style={{ color: "var(--text-primary)" }}>
          Score: <strong>{pct != null ? `${Math.round(pct)}%` : "—"}</strong>
        </span>
        <span style={{ color: "var(--text-tertiary)" }}>
          Required: {Math.round(thresholdPct)}%
        </span>
        {passed !== null && (
          <span style={{ color: passed ? "var(--status-success)" : "var(--status-danger)" }}>
            {passed ? "✓ Threshold Met" : "✗ Below Threshold"}
          </span>
        )}
      </div>
    </div>
  );
}
