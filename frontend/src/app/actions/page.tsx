"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Send, Eye, Clock, CheckCircle2, XCircle, RefreshCw, Zap } from "lucide-react";

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

const STATUS_ICON: Record<string, JSX.Element> = {
  draft: <Clock size={14} className="text-amber-400" />,
  sent: <CheckCircle2 size={14} className="text-emerald-400" />,
  cancelled: <XCircle size={14} className="text-red-400" />,
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

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const send = async (id: string) => {
    setSending(id);
    try {
      const result = await api.sendAction(id);
      showToast(`✅ Action sent via ${result.mcp_server_used || "dashboard"}`);
      await load();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="min-h-screen p-8 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 glass border border-white/10 rounded-xl px-5 py-3 text-sm text-white shadow-2xl slide-in max-w-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Actions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Draft messages generated after approval — you confirm before sending</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-slate-400 hover:text-white border border-white/[0.07] transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
        <Zap size={16} className="text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-300">
          <span className="font-semibold">Human-in-the-loop guaranteed.</span> Actions are only sent via MCP when you explicitly click "Send". The AI never acts autonomously.
        </p>
      </div>

      {/* Actions list */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/[0.06] animate-pulse">
              <div className="h-5 w-48 bg-slate-800 rounded mb-3" />
              <div className="h-3 w-full bg-slate-800 rounded" />
            </div>
          ))
        ) : actions.length === 0 ? (
          <div className="glass rounded-2xl p-12 border border-white/[0.06] text-center">
            <Zap size={36} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 font-medium">No actions yet</p>
            <p className="text-sm text-slate-600 mt-1">Approve a decision in the queue to generate a draft action.</p>
          </div>
        ) : (
          actions.map((action) => {
            const isExpanded = expanded === action.id;
            return (
              <div key={action.id} className="glass rounded-2xl border border-white/[0.06] overflow-hidden slide-in">
                {/* Header */}
                <div className="flex items-center gap-4 p-5">
                  {STATUS_ICON[action.status] || STATUS_ICON.draft}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-white capitalize">
                        {action.payload?.subject || action.action_type.replace("_", " ")}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        action.status === "sent" ? "bg-emerald-500/15 text-emerald-400" :
                        action.status === "draft" ? "bg-amber-500/15 text-amber-400" :
                        "bg-red-500/15 text-red-400"
                      }`}>
                        {action.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.payload?.recipient_hint && `To: ${action.payload.recipient_hint} · `}
                      {action.created_at && new Date(action.created_at).toLocaleString()}
                      {action.mcp_server_used && ` · Sent via ${action.mcp_server_used}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : action.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs text-slate-400 hover:text-white border border-white/[0.06] transition-all"
                    >
                      <Eye size={12} />
                      {isExpanded ? "Hide" : "Preview"}
                    </button>
                    {action.status === "draft" && (
                      <button
                        onClick={() => send(action.id)}
                        disabled={sending === action.id}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-40"
                      >
                        <Send size={12} />
                        {sending === action.id ? "Sending…" : "Confirm Send"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Draft preview */}
                {isExpanded && action.payload?.body && (
                  <div className="px-5 pb-5 border-t border-white/[0.04]">
                    <div className="mt-4 bg-slate-900/60 rounded-xl p-4 border border-white/[0.04]">
                      {action.payload.subject && (
                        <div className="mb-3 pb-3 border-b border-white/[0.06]">
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Subject: </span>
                          <span className="text-sm text-slate-300">{action.payload.subject}</span>
                        </div>
                      )}
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {action.payload.body}
                      </pre>
                    </div>
                    {action.status === "draft" && (
                      <p className="text-xs text-slate-600 mt-2 text-center">
                        Review the draft above. Click "Confirm Send" to deliver via MCP.
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
