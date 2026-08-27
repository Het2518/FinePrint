"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import { CheckCircle, XCircle, Clock, DollarSign, AlertTriangle, Cpu, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Decision {
  id: string;
  contract_id: string;
  situation: string;
  root_cause: string;
  recommended_action: string;
  expected_impact: { savings_annual: number; description: string };
  risk_level: string;
  confidence: number;
  requires_approval: boolean;
  approval_status: string;
  decided_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  cancel: { label: "Cancel", icon: "🚫", color: "text-red-400" },
  renegotiate_seats: { label: "Renegotiate", icon: "🤝", color: "text-amber-400" },
  renew: { label: "Renew", icon: "✅", color: "text-emerald-400" },
  manual_review: { label: "Review", icon: "👁️", color: "text-slate-400" },
};

export default function ApprovalsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listDecisions(filter);
      setDecisions(data.decisions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const approve = async (id: string) => {
    setActing(id);
    try {
      await api.approveDecision(id);
      showToast("✅ Decision approved — action draft generated");
      await load();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      await api.rejectDecision(id);
      showToast("Decision rejected");
      await load();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActing(null);
    }
  };

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen p-8 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 glass border border-white/10 rounded-xl px-5 py-3 text-sm text-white shadow-2xl slide-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Approval Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review AI recommendations before any action is taken</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-slate-400 hover:text-white border border-white/[0.07] transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected", "auto_approved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === s
                ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                : "glass text-slate-400 border border-white/[0.06] hover:text-white"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Decision Cards */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-white/[0.06] animate-pulse">
              <div className="h-5 w-48 bg-slate-800 rounded mb-3" />
              <div className="h-3 w-full bg-slate-800 rounded mb-2" />
              <div className="h-3 w-3/4 bg-slate-800 rounded" />
            </div>
          ))
        ) : decisions.length === 0 ? (
          <div className="glass rounded-2xl p-12 border border-white/[0.06] text-center">
            <Cpu size={36} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 font-medium">No {filter.replace("_", " ")} decisions</p>
            <p className="text-sm text-slate-600 mt-1">
              {filter === "pending"
                ? "All caught up! Upload and scan a contract to generate decisions."
                : "Nothing here yet."}
            </p>
          </div>
        ) : (
          decisions.map((d) => {
            const actionCfg = ACTION_CONFIG[d.recommended_action] || ACTION_CONFIG.manual_review;
            return (
              <div key={d.id} className="glass rounded-2xl border border-white/[0.06] overflow-hidden slide-in hover:border-white/10 transition-colors">
                {/* Card header */}
                <div className="flex items-center gap-4 p-5 border-b border-white/[0.04]">
                  <div className="text-2xl">{actionCfg.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-sm font-bold ${actionCfg.color} capitalize`}>
                        {actionCfg.label}
                      </span>
                      {d.risk_level && <RiskBadge level={d.risk_level} />}
                      {d.confidence != null && (
                        <span className="text-xs text-slate-500">
                          {Math.round(d.confidence * 100)}% confident
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(d.decided_at).toLocaleString()}</p>
                  </div>

                  {/* Expected savings */}
                  {d.expected_impact?.savings_annual > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Potential Saving</p>
                      <p className="text-lg font-bold text-emerald-400">{fmtUSD(d.expected_impact.savings_annual)}<span className="text-xs text-slate-500">/yr</span></p>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Situation</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{d.situation || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Root Cause</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{d.root_cause || "—"}</p>
                  </div>
                  {d.expected_impact?.description && (
                    <div className="col-span-2 p-3 rounded-xl bg-slate-800/50">
                      <p className="text-xs text-slate-400">{d.expected_impact.description}</p>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.04] bg-slate-900/30">
                  <Link
                    href={`/contracts/${d.contract_id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View Contract →
                  </Link>

                  {filter === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => reject(d.id)}
                        disabled={acting === d.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                      <button
                        onClick={() => approve(d.id)}
                        disabled={acting === d.id}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40"
                      >
                        <CheckCircle size={14} />
                        {acting === d.id ? "Approving…" : "Approve"}
                      </button>
                    </div>
                  )}

                  {filter !== "pending" && (
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      d.approval_status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                      d.approval_status === "auto_approved" ? "bg-indigo-500/15 text-indigo-400" :
                      "bg-red-500/15 text-red-400"
                    }`}>
                      {d.approval_status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
