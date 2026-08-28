"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Send, Eye, Clock, CheckCircle2, XCircle, RefreshCw, Zap, Shield,
} from "lucide-react";

interface Action {
  id: string;
  decision_id: string;
  action_type: string;
  status: string;
  payload: {
    subject?: string;
    body?: string;
    recipient_hint?: string;
    action_type?: string;
  } | null;
  mcp_server_used: string | null;
  executed_at: string | null;
  created_at: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ size?: number }>; color: string }
> = {
  draft: { icon: Clock, color: "var(--status-warning)" },
  sent: { icon: CheckCircle2, color: "var(--status-success)" },
  cancelled: { icon: XCircle, color: "var(--status-danger)" },
};

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listActions();
      setActions(data.actions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const send = async (id: string) => {
    setSending(id);
    try {
      const result = await api.sendAction(id);
      showToast(
        `Action sent via ${result.mcp_server_used || "dashboard"}`
      );
      await load();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 rounded-md px-5 py-3 text-sm max-w-sm animate-slide-up"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Actions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Draft messages generated after approval -- you confirm before sending
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-md transition-colors duration-150"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin-slow" : ""}
          />
        </button>
      </div>

      {/* Info banner */}
      <div
        className="mb-6 p-4 rounded-md flex items-start gap-3"
        style={{
          background: "var(--accent-muted)",
          border: "1px solid var(--accent-border)",
        }}
      >
        <Shield
          size={16}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--accent)" }}>
          <span className="font-semibold">Human-in-the-loop guaranteed.</span>{" "}
          Actions are only sent via MCP when you explicitly click
          &quot;Send&quot;. The AI never acts autonomously.
        </p>
      </div>

      {/* Actions list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-md skeleton"
              style={{ height: "80px" }}
            />
          ))
        ) : actions.length === 0 ? (
          <div
            className="rounded-md p-12 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Zap
              size={36}
              className="mx-auto mb-4"
              style={{ color: "var(--text-disabled)" }}
            />
            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
              No actions yet
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Approve a decision in the queue to generate a draft action.
            </p>
          </div>
        ) : (
          actions.map((action, idx) => {
            const isExpanded = expanded === action.id;
            const statusCfg =
              STATUS_CONFIG[action.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={action.id}
                className="rounded-md overflow-hidden animate-slide-up"
                style={{
                  animationDelay: `${idx * 50}ms`,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-4 p-5">
                  <StatusIcon
                    size={16}
                    style={{ color: statusCfg.color, flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p
                        className="text-sm font-semibold capitalize truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {action.payload?.subject ||
                          action.action_type.replace("_", " ")}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          color: statusCfg.color,
                          background:
                            action.status === "sent"
                              ? "var(--status-success-muted)"
                              : action.status === "draft"
                                ? "var(--status-warning-muted)"
                                : "var(--status-danger-muted)",
                        }}
                      >
                        {action.status}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-0.5 font-mono truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {action.payload?.recipient_hint &&
                        `To: ${action.payload.recipient_hint} · `}
                      {action.created_at &&
                        new Date(action.created_at).toLocaleString()}
                      {action.mcp_server_used &&
                        ` · via ${action.mcp_server_used}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setExpanded(isExpanded ? null : action.id)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
                      style={{
                        background: "var(--bg-surface-raised)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Eye size={12} />
                      {isExpanded ? "Hide" : "Preview"}
                    </button>
                    {action.status === "draft" && (
                      <button
                        onClick={() => send(action.id)}
                        disabled={sending === action.id}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
                        style={{
                          background: "var(--accent)",
                          color: "var(--accent-text)",
                        }}
                      >
                        <Send size={12} />
                        {sending === action.id
                          ? "Sending..."
                          : "Confirm Send"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Draft preview */}
                {isExpanded && action.payload?.body && (
                  <div
                    className="px-5 pb-5"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="mt-4 rounded-md p-4"
                      style={{
                        background: "var(--bg-surface-raised)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {action.payload.subject && (
                        <div
                          className="mb-3 pb-3"
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                          }}
                        >
                          <span
                            className="text-[11px] uppercase tracking-widest font-semibold"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            Subject:{" "}
                          </span>
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {action.payload.subject}
                          </span>
                        </div>
                      )}
                      <pre
                        className="text-sm whitespace-pre-wrap font-sans leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {action.payload.body}
                      </pre>
                    </div>
                    {action.status === "draft" && (
                      <p
                        className="text-xs mt-2 text-center"
                        style={{ color: "var(--text-disabled)" }}
                      >
                        Review the draft above. Click &quot;Confirm Send&quot; to
                        deliver via MCP.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
