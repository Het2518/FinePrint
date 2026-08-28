"use client";

import {
  CheckCircle2, XCircle, Clock, AlertCircle, Cpu, User, Settings,
  Zap, Shield, FileText,
} from "lucide-react";

interface TimelineEventProps {
  action: string;
  entityType?: string | null;
  userId?: string | null;
  detail?: string | null;
  timestamp: string;
  isLast?: boolean;
}

const ACTION_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  "contract.uploaded":   { icon: <FileText size={13} />,    label: "Contract Uploaded",       color: "var(--accent)" },
  "contract.scanned":    { icon: <Cpu size={13} />,          label: "AI Scan Completed",       color: "var(--status-success)" },
  "decision.approved":   { icon: <CheckCircle2 size={13} />, label: "Decision Approved",       color: "var(--status-success)" },
  "decision.rejected":   { icon: <XCircle size={13} />,      label: "Decision Rejected",       color: "var(--status-danger)" },
  "action.sent":         { icon: <Zap size={13} />,          label: "Action Executed",         color: "var(--accent)" },
  "mcp.connected":       { icon: <Shield size={13} />,       label: "MCP Server Connected",    color: "var(--status-success)" },
  "mcp.disconnected":    { icon: <Shield size={13} />,       label: "MCP Server Disconnected", color: "var(--status-warning)" },
  "settings.updated":    { icon: <Settings size={13} />,     label: "Settings Updated",        color: "var(--text-secondary)" },
};

function getActorIcon(userId: string | null | undefined) {
  if (!userId) return <Cpu size={13} />;
  return <User size={13} />;
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return "just now";
}

export default function TimelineEvent({
  action,
  entityType,
  userId,
  detail,
  timestamp,
  isLast = false,
}: TimelineEventProps) {
  const meta = ACTION_META[action] ?? {
    icon: <AlertCircle size={13} />,
    label: action.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "var(--text-secondary)",
  };

  return (
    <div className="flex gap-3 relative">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-[14px] top-7 bottom-0 w-px"
          style={{ background: "var(--border-subtle)" }}
        />
      )}

      {/* Icon bubble */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
        style={{
          background: "var(--bg-surface-raised)",
          border: "1px solid var(--border-subtle)",
          color: meta.color,
        }}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {meta.label}
            </p>
            {detail && (
              <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text-tertiary)" }}>
                {detail}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--text-disabled)" }}
              >
                {userId ? "Human" : "AI System"}
              </span>
              {entityType && (
                <>
                  <span style={{ color: "var(--border-default)" }}>·</span>
                  <span className="text-[10px] font-mono capitalize" style={{ color: "var(--text-disabled)" }}>
                    {entityType}
                  </span>
                </>
              )}
            </div>
          </div>
          <span
            className="text-[11px] shrink-0 tabular-nums"
            style={{ color: "var(--text-disabled)" }}
            title={new Date(timestamp).toLocaleString()}
          >
            {relativeTime(timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
