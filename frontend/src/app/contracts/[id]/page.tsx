"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import PipelineNode from "@/components/PipelineNode";
import PolicyRuleRow from "@/components/PolicyRuleRow";
import RiskMeter from "@/components/RiskMeter";
import TimelineEvent from "@/components/TimelineEvent";
import EmptyState from "@/components/EmptyState";
import CurrencyValue from "@/components/CurrencyValue";
import {
  ArrowLeft, ScanLine, Loader2, FileText, RotateCcw,
  Calendar, DollarSign, RefreshCw, AlertTriangle, Cpu,
  CheckCircle2, Clock, Building2, Zap, Users,
} from "lucide-react";

type Tab = "overview" | "pipeline" | "analysis" | "audit";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [orgSettings, setOrgSettings] = useState<any>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const [contractData, auditData] = await Promise.all([
        api.getContract(id),
        api.listAuditLogs({ contract_id: id, limit: 50 }),
      ]);
      setContract(contractData);
      setAuditEvents(auditData.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [id]);

  // Load org settings for currency
  useEffect(() => {
    api.getOrgSettings().then(setOrgSettings).catch(() => {});
  }, []);

  // Poll while scanning
  useEffect(() => {
    if (contract?.status === "scanning") {
      const interval = setInterval(() => load(true), 3000);
      return () => clearInterval(interval);
    }
  }, [contract?.status, load]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await api.triggerScan(id);
      await load(true);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="space-y-4">
          <div className="h-7 w-40 rounded-md skeleton" />
          <div className="h-32 rounded-md skeleton" />
          <div className="h-64 rounded-md skeleton" />
          <div className="h-80 rounded-md skeleton" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={<FileText size={18} />}
          title="Contract not found"
          description="This contract may have been deleted or you may not have access."
          action={
            <button
              onClick={() => router.push("/contracts")}
              className="text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              Back to Contracts
            </button>
          }
        />
      </div>
    );
  }

  const currency = orgSettings?.display_currency ?? "USD";
  const clause = contract.clauses?.[0];
  const decision = contract.decisions?.[0];
  const agentRuns: any[] = contract.agent_runs ?? [];

  // Build pipeline nodes from actual agent_runs
  const PIPELINE_ORDER = ["detection", "risk", "finance", "decision", "rule_check"];
  const agentRunMap: Record<string, any> = {};
  agentRuns.forEach((r: any) => { agentRunMap[r.agent_name] = r; });

  const pipelineNodes = PIPELINE_ORDER.map((name) => {
    const run = agentRunMap[name];
    if (!run) {
      return { agentName: name, status: "pending" as const, label: nodeLabelMap[name] };
    }
    return {
      agentName: name,
      label: nodeLabelMap[name],
      status: run.status as "completed" | "failed" | "running",
      confidence: run.confidence,
      reasoningSummary: run.reasoning_summary,
      mcpToolCalls: (run.mcp_tool_calls || []).map((t: any) =>
        typeof t === "string"
          ? { tool: t, server: "mcp" }
          : { tool: t.tool ?? t.name ?? String(t), server: t.server ?? "mcp" }
      ),
      startedAt: run.started_at,
      completedAt: run.completed_at,
    };
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview",  label: "Overview" },
    { key: "pipeline",  label: "Intelligence Pipeline", count: agentRuns.length },
    { key: "analysis",  label: "AI Analysis & Decision" },
    { key: "audit",     label: "Audit History", count: auditEvents.length },
  ];

  return (
    <div className="min-h-screen">
      {/* Back nav */}
      <div className="px-6 lg:px-8 pt-6 pb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        >
          <ArrowLeft size={14} />
          Contracts
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {clause?.vendor_name ?? "Unknown Vendor"}
              </h1>
              {decision?.risk_level && <RiskBadge level={decision.risk_level} />}
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-sm font-mono" style={{ color: "var(--text-tertiary)" }}>
              {contract.file_name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              className="p-2 rounded-md transition-colors"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={triggerScan}
              disabled={scanning || contract.status === "scanning"}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: "var(--accent)", color: "var(--accent-text)" }}
            >
              {scanning || contract.status === "scanning" ? (
                <Loader2 size={14} className="animate-spin-slow" />
              ) : (
                <ScanLine size={14} />
              )}
              {scanning || contract.status === "scanning" ? "Scanning…" : "Run AI Scan"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-0 -mb-px"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="px-4 py-2.5 text-sm font-medium transition-colors relative"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  background: "transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: "var(--bg-surface-raised)", color: "var(--text-disabled)" }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 lg:px-8 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Metadata card */}
            <div
              className="lg:col-span-2 rounded-md p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>
                Contract Metadata
              </h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  {
                    label: "Vendor",
                    value: clause?.vendor_name ?? "—",
                    icon: <Building2 size={13} />,
                  },
                  {
                    label: "Annual Value",
                    value: clause ? (
                      <CurrencyValue amount={clause.contract_value_annual} currency={currency} />
                    ) : "—",
                    icon: <DollarSign size={13} />,
                  },
                  {
                    label: "Renewal Date",
                    value: clause?.renewal_date
                      ? new Date(clause.renewal_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "—",
                    icon: <Calendar size={13} />,
                  },
                  {
                    label: "Auto-Renew",
                    value: clause?.auto_renew === true ? (
                      <span style={{ color: "var(--status-warning)" }}>⚠ Yes — Auto-renew active</span>
                    ) : clause?.auto_renew === false ? "No" : "—",
                    icon: <RotateCcw size={13} />,
                  },
                  {
                    label: "Notice Period",
                    value: clause?.notice_period_days ? `${clause.notice_period_days} days` : "—",
                    icon: <Clock size={13} />,
                  },
                  {
                    label: "Price Escalation",
                    value: clause?.price_escalation_pct ? `${clause.price_escalation_pct}%/yr` : "—",
                    icon: <AlertTriangle size={13} />,
                  },
                  {
                    label: "Last Scanned",
                    value: contract.last_scanned_at
                      ? new Date(contract.last_scanned_at).toLocaleString()
                      : "Never",
                    icon: <Cpu size={13} />,
                  },
                  {
                    label: "Source",
                    value: contract.source?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "—",
                    icon: <FileText size={13} />,
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <dt className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                      {icon} {label}
                    </dt>
                    <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {clause?.ambiguous_clauses?.length > 0 && (
                <div
                  className="mt-5 p-3 rounded-md"
                  style={{
                    background: "var(--status-warning-muted)",
                    border: "1px solid var(--status-warning-border)",
                  }}
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--status-warning)" }}>
                    ⚠ Ambiguous Clauses Detected
                  </p>
                  <ul className="space-y-1">
                    {clause.ambiguous_clauses.map((c: string, i: number) => (
                      <li key={i} className="text-xs" style={{ color: "var(--status-warning)" }}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="space-y-4">
              {/* Decision summary */}
              {decision ? (
                <div
                  className="rounded-md p-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                    Latest Decision
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Risk Level</span>
                      {decision.risk_level ? <RiskBadge level={decision.risk_level} /> : <span style={{ color: "var(--text-disabled)" }}>—</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Approval</span>
                      <StatusBadge status={decision.approval_status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Action</span>
                      <span className="text-xs font-medium capitalize" style={{ color: "var(--text-primary)" }}>
                        {decision.recommended_action?.replace(/_/g, " ") ?? "—"}
                      </span>
                    </div>
                    {decision.expected_impact?.savings_annual != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Potential Savings</span>
                        <span className="text-xs font-semibold" style={{ color: "var(--status-success)" }}>
                          <CurrencyValue amount={decision.expected_impact.savings_annual} currency={currency} />
                        </span>
                      </div>
                    )}
                  </div>
                  {decision.approval_status === "pending" && (
                    <Link
                      href="/approvals"
                      className="mt-3 flex items-center gap-1.5 w-full justify-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                      style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                    >
                      Review Decision →
                    </Link>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-md p-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <EmptyState
                    compact
                    icon={<Cpu size={16} />}
                    title="Not yet scanned"
                    description="Run an AI scan to generate a risk decision for this contract."
                  />
                </div>
              )}

              {/* Extraction confidence */}
              {clause?.extraction_confidence != null && (
                <RiskMeter
                  confidence={clause.extraction_confidence}
                  threshold={0.6}
                  riskLevel={decision?.risk_level}
                />
              )}
            </div>
          </div>
        )}

        {/* PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <div className="max-w-2xl">
            <div className="mb-5">
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Contract Intelligence Pipeline
              </h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                The AI analysis pipeline stages — based on actual agent execution records. Policy rules run deterministically, never by the LLM.
              </p>
            </div>

            {agentRuns.length === 0 ? (
              <EmptyState
                icon={<Cpu size={18} />}
                title="No pipeline runs yet"
                description="Trigger a scan to run the AI analysis pipeline on this contract."
              />
            ) : (
              <div className="pt-2">
                {/* Ingestion pseudo-node */}
                <PipelineNode
                  agentName="ingestion"
                  label="Contract Ingestion"
                  status="completed"
                  reasoningSummary={`Document ingested: ${contract.file_name}`}
                  startedAt={contract.uploaded_at}
                  completedAt={contract.last_scanned_at}
                />

                {pipelineNodes.map((node, i) => (
                  <PipelineNode
                    key={node.agentName}
                    {...node}
                    isLast={i === pipelineNodes.length - 1}
                  />
                ))}

                {/* Rule check pseudo-node */}
                {decision && (
                  <PipelineNode
                    agentName="rule_check"
                    label="Deterministic Policy Rules"
                    status="completed"
                    reasoningSummary={
                      decision.requires_approval
                        ? `Human approval required: Impact threshold exceeded`
                        : `Auto-approved: Below approval threshold`
                    }
                    isLast
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {!decision ? (
              <div className="lg:col-span-2">
                <EmptyState
                  icon={<Cpu size={18} />}
                  title="No AI analysis yet"
                  description="Run a scan to generate an AI decision for this contract."
                />
              </div>
            ) : (
              <>
                {/* AI Analysis */}
                <div className="space-y-4">
                  <div
                    className="rounded-md p-5"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Cpu size={14} style={{ color: "var(--accent)" }} />
                      <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                        AI Analysis
                      </h2>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--accent-muted)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-border)",
                        }}
                      >
                        LLM OUTPUT
                      </span>
                    </div>
                    <div className="space-y-4">
                      {decision.situation && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                            Situation
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                            {decision.situation}
                          </p>
                        </div>
                      )}
                      {decision.root_cause && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                            Root Cause
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                            {decision.root_cause}
                          </p>
                        </div>
                      )}
                      {decision.recommended_action && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                            Recommended Action
                          </p>
                          <p className="text-sm font-semibold capitalize" style={{ color: "var(--accent)" }}>
                            {decision.recommended_action.replace(/_/g, " ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confidence meter */}
                  <RiskMeter
                    confidence={decision.confidence}
                    threshold={0.6}
                    riskLevel={decision.risk_level}
                  />

                  {/* Financial impact */}
                  {decision.expected_impact && (
                    <div
                      className="rounded-md p-5"
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                    >
                      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                        Expected Financial Impact
                      </h2>
                      <div className="space-y-2">
                        {Object.entries(decision.expected_impact).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-xs" style={{ color: "var(--text-tertiary)" }}>
                              {k.replace(/_/g, " ")}
                            </span>
                            <span className="font-semibold font-mono" style={{ color: "var(--status-success)" }}>
                              <CurrencyValue amount={Number(v)} currency={currency} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Policy Evaluation */}
                <div
                  className="rounded-md p-5"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={14} style={{ color: "var(--text-secondary)" }} />
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                      Policy Rule Evaluation
                    </h2>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--bg-surface-raised)",
                        color: "var(--text-disabled)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      NOT AI
                    </span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
                    These rules are evaluated deterministically in Python — they are never influenced by the LLM.
                  </p>
                  <div>
                    <PolicyRuleRow
                      label="Human Approval Required"
                      description="Triggered when estimated financial impact exceeds the org approval threshold."
                      evaluated={
                        decision.expected_impact?.savings_annual != null
                          ? `$${Math.round(decision.expected_impact.savings_annual).toLocaleString()}`
                          : undefined
                      }
                      threshold="Org threshold"
                      passed={decision.requires_approval}
                    />
                    <PolicyRuleRow
                      label="Second Approver Required"
                      description="Triggered when financial impact exceeds the second approver threshold."
                      passed={decision.requires_second_approver ?? false}
                    />
                    <PolicyRuleRow
                      label="AI Confidence Above Threshold"
                      description="Minimum confidence required to trust the AI output."
                      evaluated={decision.confidence != null ? `${Math.round(decision.confidence * 100)}%` : undefined}
                      threshold="60%"
                      passed={decision.confidence != null ? decision.confidence >= 0.6 : null}
                    />
                  </div>

                  {/* Approval chain visualization */}
                  <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
                      Approval Chain
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "AI Analysis", done: true },
                        { label: "Policy Evaluation", done: true },
                        {
                          label: "Human Approval",
                          done: ["approved", "rejected", "auto_approved"].includes(decision.approval_status),
                          active: decision.approval_status === "pending",
                          status: decision.approval_status,
                        },
                        ...(decision.requires_second_approver
                          ? [{
                              label: "Second Approver",
                              done: false,
                              active: decision.approval_status === "approved",
                              isWarning: true,
                            }]
                          : []),
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: step.done
                                ? "var(--status-success-muted)"
                                : step.active
                                ? "var(--accent-muted)"
                                : "var(--bg-surface-raised)",
                              border: `1px solid ${
                                step.done
                                  ? "var(--status-success-border)"
                                  : step.active
                                  ? "var(--accent-border)"
                                  : "var(--border-subtle)"
                              }`,
                            }}
                          >
                            {step.done ? (
                              <CheckCircle2 size={11} style={{ color: "var(--status-success)" }} />
                            ) : step.active ? (
                              <Clock size={11} style={{ color: "var(--accent)" }} />
                            ) : (
                              <div className="w-2 h-2 rounded-full" style={{ background: "var(--border-subtle)" }} />
                            )}
                          </div>
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: step.done
                                ? "var(--status-success)"
                                : step.active
                                ? "var(--text-primary)"
                                : "var(--text-disabled)",
                            }}
                          >
                            {step.label}
                          </span>
                          {(step as any).isWarning && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                background: "var(--status-warning-muted)",
                                color: "var(--status-warning)",
                                border: "1px solid var(--status-warning-border)",
                              }}
                            >
                              Required
                            </span>
                          )}
                          {step.active && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--accent)" }}
                            >
                              · Awaiting decision
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {decision.approval_status === "pending" && (
                      <Link
                        href="/approvals"
                        className="mt-4 flex items-center gap-1.5 w-full justify-center px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                      >
                        <Users size={12} />
                        Go to Approvals
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Audit History
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
              Immutable record of all events related to this contract.
            </p>
            {auditEvents.length === 0 ? (
              <EmptyState
                icon={<Clock size={18} />}
                title="No events yet"
                description="Events will appear here as the contract is processed and decisions are made."
              />
            ) : (
              <div className="pt-2">
                {auditEvents.map((e, i) => (
                  <TimelineEvent
                    key={e.id}
                    action={e.action}
                    entityType={e.entity_type}
                    userId={e.user_id}
                    detail={e.detail}
                    timestamp={e.timestamp}
                    isLast={i === auditEvents.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeLabelMap: Record<string, string> = {
  detection:  "Detection Agent",
  risk:       "Risk Analysis Agent",
  finance:    "Finance Agent",
  decision:   "Decision Agent",
  rule_check: "Policy Rule Engine",
  action:     "Action Agent",
};
