"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import AgentTrail from "@/components/AgentTrail";
import {
  ArrowLeft, ScanLine, Calendar, DollarSign, RotateCcw, AlertTriangle,
  CheckCircle, Clock, Cpu, FileText, ChevronDown, ChevronUp,
} from "lucide-react";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "decisions">("overview");
  const [showRaw, setShowRaw] = useState(false);

  const load = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await api.getContract(id);
      setContract(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (contract?.status === "scanning") {
      const interval = setInterval(() => load(true), 3000);
      return () => clearInterval(interval);
    }
  }, [contract?.status]);

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
      <div className="min-h-screen p-6 lg:p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-md skeleton" />
          <div className="h-48 rounded-lg skeleton" />
          <div className="h-96 rounded-lg skeleton" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div
        className="min-h-screen p-8 text-center pt-32"
        style={{ color: "var(--text-secondary)" }}
      >
        Contract not found.
      </div>
    );
  }

  const clause = contract.clauses?.[0];
  const latestDecision = contract.decisions?.[0];

  const fmtUSD = (n: number | null | undefined) =>
    n != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n)
      : "--";

  const tabs = ["overview", "agents", "decisions"] as const;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Back + Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm mb-6 transition-colors duration-150"
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-tertiary)";
        }}
      >
        <ArrowLeft size={16} />
        Back to Contracts
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {clause?.vendor_name || "Unknown Vendor"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {contract.file_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestDecision?.risk_level && (
            <RiskBadge level={latestDecision.risk_level} />
          )}
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            <ScanLine
              size={14}
              className={scanning ? "animate-spin-slow" : ""}
            />
            {scanning ? "Scanning..." : "Re-scan"}
          </button>
        </div>
      </div>

      {/* Clause KPIs */}
      {clause && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Annual Value",
              value: fmtUSD(clause.contract_value_annual),
              icon: <DollarSign size={14} />,
            },
            {
              label: "Renewal Date",
              value: clause.renewal_date || "--",
              icon: <Calendar size={14} />,
            },
            {
              label: "Notice Period",
              value: clause.notice_period_days
                ? `${clause.notice_period_days} days`
                : "--",
              icon: <Clock size={14} />,
            },
            {
              label: "Price Escalation",
              value: clause.price_escalation_pct
                ? `${clause.price_escalation_pct}%`
                : "--",
              icon: <AlertTriangle size={14} />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-lg p-4"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: "var(--text-disabled)" }}>{icon}</span>
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {label}
                </span>
              </div>
              <p
                className="text-lg font-bold font-mono tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Auto-renew indicator */}
      {clause && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            background: clause.auto_renew
              ? "var(--status-warning-muted)"
              : "var(--status-success-muted)",
            border: `1px solid ${
              clause.auto_renew
                ? "var(--status-warning-border)"
                : "var(--status-success-border)"
            }`,
            color: clause.auto_renew
              ? "var(--status-warning)"
              : "var(--status-success)",
          }}
        >
          {clause.auto_renew ? <RotateCcw size={16} /> : <CheckCircle size={16} />}
          <span className="text-sm font-medium">
            {clause.auto_renew
              ? "This contract auto-renews -- ensure notice is sent before the deadline."
              : "This contract requires manual renewal action."}
          </span>
          {clause.extraction_confidence != null && (
            <span className="ml-auto text-xs opacity-70 font-mono tabular-nums">
              AI confidence: {Math.round(clause.extraction_confidence * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Tabs — underline style */}
      <div
        className="flex gap-0 mb-6"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-4 py-2.5 text-sm font-medium capitalize transition-colors duration-150"
            style={{
              color:
                activeTab === tab ? "var(--accent)" : "var(--text-tertiary)",
            }}
          >
            {tab === "agents" ? "Agent Reasoning Trail" : tab}
            {activeTab === tab && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "var(--accent)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {latestDecision ? (
            <div
              className="rounded-lg p-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Latest AI Decision
                </p>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    color:
                      latestDecision.approval_status === "approved"
                        ? "var(--status-success)"
                        : latestDecision.approval_status === "pending"
                          ? "var(--status-warning)"
                          : latestDecision.approval_status === "auto_approved"
                            ? "var(--accent)"
                            : "var(--status-danger)",
                    background:
                      latestDecision.approval_status === "approved"
                        ? "var(--status-success-muted)"
                        : latestDecision.approval_status === "pending"
                          ? "var(--status-warning-muted)"
                          : latestDecision.approval_status === "auto_approved"
                            ? "var(--accent-muted)"
                            : "var(--status-danger-muted)",
                  }}
                >
                  {latestDecision.approval_status?.replace("_", " ")}
                </span>
              </div>
              {latestDecision.situation && (
                <div className="mb-3">
                  <p
                    className="text-[11px] uppercase tracking-widest mb-1 font-semibold"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Situation
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {latestDecision.situation}
                  </p>
                </div>
              )}
              {latestDecision.root_cause && (
                <div className="mb-3">
                  <p
                    className="text-[11px] uppercase tracking-widest mb-1 font-semibold"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Root Cause
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {latestDecision.root_cause}
                  </p>
                </div>
              )}
              {latestDecision.recommended_action && (
                <div
                  className="flex items-center gap-3 mt-4 p-3 rounded-md"
                  style={{ background: "var(--bg-surface-raised)" }}
                >
                  <span
                    className="text-[11px] uppercase tracking-widest font-semibold"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Recommended
                  </span>
                  <span
                    className="px-3 py-1 rounded-md text-sm font-semibold capitalize"
                    style={{
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    {latestDecision.recommended_action.replace("_", " ")}
                  </span>
                  {latestDecision.expected_impact?.savings_annual > 0 && (
                    <span
                      className="text-sm font-medium ml-auto font-mono tabular-nums"
                      style={{ color: "var(--status-success)" }}
                    >
                      Save {fmtUSD(latestDecision.expected_impact.savings_annual)}/yr
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-lg p-8 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-tertiary)",
              }}
            >
              <Cpu
                size={32}
                className="mx-auto mb-3"
                style={{ opacity: 0.3 }}
              />
              <p className="text-sm">No AI analysis yet.</p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-disabled)" }}
              >
                Click &quot;Re-scan&quot; to run the agent pipeline.
              </p>
            </div>
          )}

          {/* Raw text preview */}
          {contract.raw_text_preview && (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center justify-between w-full px-5 py-4 text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  Raw Contract Text Preview
                </div>
                {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showRaw && (
                <div className="px-5 pb-5">
                  <pre
                    className="text-xs font-mono rounded-md p-4 overflow-auto max-h-48 whitespace-pre-wrap"
                    style={{
                      background: "var(--bg-surface-raised)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
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
            <div
              className="rounded-lg p-8 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-tertiary)",
              }}
            >
              <p className="text-sm">No decisions yet.</p>
            </div>
          ) : (
            contract.decisions?.map((d: any) => (
              <div
                key={d.id}
                className="rounded-lg p-5"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm font-semibold capitalize"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {d.recommended_action?.replace("_", " ") || "Manual Review"}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      color:
                        d.approval_status === "approved"
                          ? "var(--status-success)"
                          : d.approval_status === "pending"
                            ? "var(--status-warning)"
                            : "var(--status-neutral)",
                      background:
                        d.approval_status === "approved"
                          ? "var(--status-success-muted)"
                          : d.approval_status === "pending"
                            ? "var(--status-warning-muted)"
                            : "var(--status-neutral-muted)",
                    }}
                  >
                    {d.approval_status}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {d.situation}
                </p>
                {d.decided_at && (
                  <p
                    className="text-xs mt-2 font-mono"
                    style={{ color: "var(--text-disabled)" }}
                  >
                    {new Date(d.decided_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
