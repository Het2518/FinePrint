"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import AgentTrail from "@/components/AgentTrail";
import {
  ArrowLeft, ScanLine, Calendar, DollarSign, RotateCcw, AlertTriangle,
  CheckCircle, Clock, Cpu, FileText, ChevronDown, ChevronUp
} from "lucide-react";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "decisions">("overview");
  const [showRaw, setShowRaw] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getContract(id);
      setContract(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await api.triggerScan(id);
      setTimeout(load, 3000);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-lg bg-slate-800 animate-pulse" />
          <div className="h-48 rounded-2xl bg-slate-800 animate-pulse" />
          <div className="h-96 rounded-2xl bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen p-8 text-center pt-32">
        <p className="text-slate-400">Contract not found.</p>
      </div>
    );
  }

  const clause = contract.clauses?.[0];
  const latestDecision = contract.decisions?.[0];

  const fmtUSD = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  return (
    <div className="min-h-screen p-8">
      {/* Back + Header */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to Contracts
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {clause?.vendor_name || "Unknown Vendor"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{contract.file_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {latestDecision?.risk_level && <RiskBadge level={latestDecision.risk_level} />}
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <ScanLine size={14} className={scanning ? "animate-spin" : ""} />
            {scanning ? "Scanning…" : "Re-scan"}
          </button>
        </div>
      </div>

      {/* Clause KPIs */}
      {clause && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Annual Value", value: fmtUSD(clause.contract_value_annual), icon: <DollarSign size={16} />, color: "text-emerald-400" },
            { label: "Renewal Date", value: clause.renewal_date || "—", icon: <Calendar size={16} />, color: "text-amber-400" },
            { label: "Notice Period", value: clause.notice_period_days ? `${clause.notice_period_days} days` : "—", icon: <Clock size={16} />, color: "text-indigo-400" },
            { label: "Price Escalation", value: clause.price_escalation_pct ? `${clause.price_escalation_pct}%` : "—", icon: <AlertTriangle size={16} />, color: "text-red-400" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/[0.06]">
              <div className={`flex items-center gap-2 ${color} mb-2`}>
                {icon}
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Auto-renew indicator */}
      {clause && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
          clause.auto_renew
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          {clause.auto_renew ? <RotateCcw size={16} /> : <CheckCircle size={16} />}
          <span className="text-sm font-medium">
            {clause.auto_renew
              ? "⚠️ This contract auto-renews — ensure you send notice before the deadline."
              : "✓ This contract requires manual renewal action."}
          </span>
          {clause.extraction_confidence != null && (
            <span className="ml-auto text-xs opacity-60">
              AI confidence: {Math.round(clause.extraction_confidence * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl border border-white/[0.06] w-fit">
        {(["overview", "agents", "decisions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
              activeTab === tab ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "agents" ? "Agent Reasoning Trail" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Latest decision card */}
          {latestDecision ? (
            <div className="glass rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-300">Latest AI Decision</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  latestDecision.approval_status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                  latestDecision.approval_status === "pending" ? "bg-amber-500/15 text-amber-400" :
                  latestDecision.approval_status === "auto_approved" ? "bg-indigo-500/15 text-indigo-400" :
                  "bg-red-500/15 text-red-400"
                }`}>
                  {latestDecision.approval_status?.replace("_", " ")}
                </span>
              </div>
              {latestDecision.situation && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Situation</p>
                  <p className="text-sm text-slate-200">{latestDecision.situation}</p>
                </div>
              )}
              {latestDecision.root_cause && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Root Cause</p>
                  <p className="text-sm text-slate-200">{latestDecision.root_cause}</p>
                </div>
              )}
              {latestDecision.recommended_action && (
                <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-slate-800/50">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Recommended</span>
                  <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-semibold capitalize">
                    {latestDecision.recommended_action.replace("_", " ")}
                  </span>
                  {latestDecision.expected_impact?.savings_annual > 0 && (
                    <span className="text-emerald-400 text-sm font-medium ml-auto">
                      Save {fmtUSD(latestDecision.expected_impact.savings_annual)}/yr
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 border border-white/[0.06] text-center text-slate-500">
              <Cpu size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No AI analysis yet.</p>
              <p className="text-xs mt-1">Click "Re-scan" to run the agent pipeline.</p>
            </div>
          )}

          {/* Raw text preview */}
          {contract.raw_text_preview && (
            <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center justify-between w-full px-5 py-4 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  Raw Contract Text Preview
                </div>
                {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showRaw && (
                <div className="px-5 pb-5">
                  <pre className="text-xs text-slate-400 font-mono bg-slate-900/50 rounded-xl p-4 overflow-auto max-h-48 whitespace-pre-wrap">
                    {contract.raw_text_preview}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "agents" && (
        <AgentTrail agentRuns={contract.agent_runs || []} />
      )}

      {activeTab === "decisions" && (
        <div className="space-y-4">
          {contract.decisions?.length === 0 ? (
            <div className="glass rounded-2xl p-8 border border-white/[0.06] text-center text-slate-500">
              <p className="text-sm">No decisions yet.</p>
            </div>
          ) : (
            contract.decisions?.map((d: any) => (
              <div key={d.id} className="glass rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-300 capitalize">{d.recommended_action?.replace("_", " ") || "Manual Review"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.approval_status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                    d.approval_status === "pending" ? "bg-amber-500/15 text-amber-400" :
                    "bg-slate-500/15 text-slate-400"
                  }`}>{d.approval_status}</span>
                </div>
                <p className="text-xs text-slate-400">{d.situation}</p>
                {d.decided_at && <p className="text-xs text-slate-600 mt-2">{new Date(d.decided_at).toLocaleString()}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
