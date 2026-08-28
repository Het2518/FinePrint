"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Send, FileText, Loader2, Eye, ExternalLink } from "lucide-react";

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await api.listActions();
      const list = data.actions ?? [];
      setActions(list);
      if (!selected && list.length > 0) setSelected(list[0]);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      await api.sendAction(id);
      await load(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(null);
    }
  };

  const typeLabel = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const typeIcon = (type: string) => {
    if (type.includes("slack")) return "💬";
    if (type.includes("email")) return "✉️";
    return "📄";
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className="w-80 shrink-0 flex flex-col border-r"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-canvas)" }}
      >
        <div className="p-5 pb-3">
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Actions
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Draft artifacts awaiting confirmation
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-md skeleton" />)}
            </div>
          ) : actions.length === 0 ? (
            <EmptyState compact icon={<FileText size={16} />} title="No actions yet" description="Approve a decision to generate a draft action." />
          ) : (
            actions.map((a) => {
              const isSelected = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full text-left px-4 py-3.5 transition-colors"
                  style={{
                    background: isSelected ? "var(--bg-surface)" : "transparent",
                    borderLeft: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {typeIcon(a.action_type)} {typeLabel(a.action_type)}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                  </p>
                  {a.mcp_server_used && (
                    <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-disabled)" }}>
                      via {a.mcp_server_used}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState icon={<Eye size={18} />} title="Select an action" description="Choose a draft from the queue to preview and send." />
          </div>
        ) : (
          <div className="p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {typeIcon(selected.action_type)} {typeLabel(selected.action_type)}
              </h2>
              <StatusBadge status={selected.status} />
            </div>

            {/* Preview */}
            {selected.payload && (
              <div
                className="rounded-md overflow-hidden mb-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface-raised)" }}
                >
                  <Eye size={13} style={{ color: "var(--text-secondary)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Draft Preview
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {selected.payload.subject && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
                        Subject
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {selected.payload.subject}
                      </p>
                    </div>
                  )}
                  {selected.payload.body && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                        Body
                      </p>
                      <div
                        className="text-sm leading-relaxed rounded-md p-4 font-mono whitespace-pre-wrap"
                        style={{
                          background: "var(--bg-surface-raised)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {selected.payload.body}
                      </div>
                    </div>
                  )}
                  {selected.payload.channel && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
                        Channel
                      </p>
                      <p className="text-sm font-mono" style={{ color: "var(--accent)" }}>
                        {selected.payload.channel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div
              className="rounded-md p-4 mb-5 grid grid-cols-2 gap-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              {[
                { label: "Status", value: <StatusBadge status={selected.status} /> },
                { label: "MCP Server", value: selected.mcp_server_used ?? "—" },
                {
                  label: "Sent At",
                  value: selected.executed_at
                    ? new Date(selected.executed_at).toLocaleString()
                    : "Not yet sent",
                },
                {
                  label: "Created",
                  value: selected.created_at
                    ? new Date(selected.created_at).toLocaleString()
                    : "—",
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                  <div className="text-sm" style={{ color: "var(--text-primary)" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Send action */}
            {selected.status === "draft" && (
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                  Confirm Send
                </h3>
                <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
                  This action will be sent via the configured MCP server. This requires the linked decision to have been approved by a human.
                </p>
                <button
                  onClick={() => handleSend(selected.id)}
                  disabled={!!sending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                >
                  {sending === selected.id ? (
                    <Loader2 size={14} className="animate-spin-slow" />
                  ) : (
                    <Send size={14} />
                  )}
                  {sending === selected.id ? "Sending…" : "Send Now"}
                </button>
              </div>
            )}

            {selected.status === "sent" && (
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-md"
                style={{
                  background: "var(--status-success-muted)",
                  border: "1px solid var(--status-success-border)",
                }}
              >
                <Send size={16} style={{ color: "var(--status-success)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--status-success)" }}>
                  Sent successfully via {selected.mcp_server_used ?? "MCP"}
                  {selected.executed_at ? ` — ${new Date(selected.executed_at).toLocaleString()}` : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
