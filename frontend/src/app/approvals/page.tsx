"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import RiskMeter from "@/components/RiskMeter";
import PolicyRuleRow from "@/components/PolicyRuleRow";
import CurrencyValue from "@/components/CurrencyValue";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import {
  Bell, CheckCircle2, XCircle, ChevronRight,
  FileText, Users, AlertTriangle, DollarSign,
  Cpu, Zap, Clock,
} from "lucide-react";

type FilterTab = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("pending");
  const [orgSettings, setOrgSettings] = useState<any>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const status = filterTab === "pending" ? undefined : filterTab;
      const [data, settingsData] = await Promise.all([
        api.listDecisions(status),
        api.getOrgSettings().catch(() => ({ display_currency: "USD" })),
      ]);
      const list = data.decisions ?? [];
      setDecisions(list);
      // Auto-select first item
      if (list.length > 0 && !selected) setSelected(list[0]);
      setOrgSettings(settingsData);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  }, [filterTab]);

  useEffect(() => {
    setSelected(null);
    load();
  }, [filterTab]);

  const handleApprove = async (id: string) => {
    setActionLoading("approve");
    try {
      await api.approveDecision(id);
      await load(true);
      setSelected(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading("reject");
    try {
      await api.rejectDecision(id);
      await load(true);
      setSelected(null);
    } finally {
      setActionLoading(null);
    }
  };

  const currency = orgSettings?.display_currency ?? "USD";
  const approvalThreshold = orgSettings?.approval_threshold_usd ?? 5000;
  const secondThreshold = orgSettings?.second_approver_threshold_usd;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar queue */}
      <div
        className="w-80 shrink-0 flex flex-col border-r"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-canvas)",
        }}
      >
        {/* Header */}
        <div className="p-5 pb-3">
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Approvals
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Review AI decisions before execution
          </p>
        </div>

        {/* Filter tabs */}
        <div className="px-5 pb-3 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterTab(t.key)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                background: filterTab === t.key ? "var(--bg-surface)" : "transparent",
                border: filterTab === t.key ? "1px solid var(--border-subtle)" : "1px solid transparent",
                color: filterTab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Decision list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-md skeleton" />)}
            </div>
          ) : decisions.length === 0 ? (
            <EmptyState
              compact
              icon={<CheckCircle2 size={16} />}
              title={`No ${filterTab} decisions`}
            />
          ) : (
            decisions.map((d) => {
              const isSelected = selected?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="w-full text-left px-4 py-3.5 transition-colors relative"
                  style={{
                    background: isSelected ? "var(--bg-surface)" : "transparent",
                    borderLeft: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {d.vendor_name ?? d.file_name ?? "Unknown Vendor"}
                    </p>
                    {d.risk_level && <RiskBadge level={d.risk_level} />}
                  </div>
                  <p className="text-xs truncate mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                    {d.situation?.slice(0, 60) ?? "Awaiting review"}
                    {d.situation?.length > 60 ? "…" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.approval_status} />
                    {d.expected_impact?.savings_annual != null && (
                      <span className="text-xs font-mono font-semibold" style={{ color: "var(--status-success)" }}>
                        <CurrencyValue amount={d.expected_impact.savings_annual} currency={currency} />
                      </span>
                    )}
                  </div>
                  {d.requires_second_approver && (
                    <div
                      className="mt-1.5 text-[10px] px-1.5 py-0.5 inline-flex items-center gap-1 rounded"
                      style={{
                        background: "var(--status-warning-muted)",
                        color: "var(--status-warning)",
                      }}
                    >
                      <Users size={9} /> 2nd Approver Required
                    </div>
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
            <EmptyState
              icon={<Bell size={18} />}
              title="Select a decision to review"
              description="Choose a decision from the queue on the left."
            />
          </div>
        ) : (
          <div className="p-6 max-w-3xl">
            {/* Decision header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {selected.vendor_name ?? "Unknown Vendor"}
                </h2>
                {selected.risk_level && <RiskBadge level={selected.risk_level} />}
                {selected.requires_second_approver && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                    style={{
                      background: "var(--status-warning-muted)",
                      color: "var(--status-warning)",
                      border: "1px solid var(--status-warning-border)",
                    }}
                  >
                    <AlertTriangle size={10} /> Second Approver Required
                  </span>
                )}
              </div>
              {selected.file_name && (
                <p className="text-sm font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {selected.file_name}
                </p>
              )}
            </div>

            <div className="space-y-5">
              {/* AI Analysis */}
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={13} style={{ color: "var(--accent)" }} />
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                    AI Analysis
                  </h3>
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
                  {selected.situation && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                        Situation
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {selected.situation}
                      </p>
                    </div>
                  )}
                  {selected.root_cause && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                        Root Cause
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {selected.root_cause}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    <div>
                      <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Recommended</p>
                      <p className="text-sm font-semibold capitalize" style={{ color: "var(--accent)" }}>
                        {selected.recommended_action?.replace(/_/g, " ") ?? "—"}
                      </p>
                    </div>
                    {selected.expected_impact?.savings_annual != null && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Potential Savings</p>
                        <p className="text-sm font-bold font-mono" style={{ color: "var(--status-success)" }}>
                          <CurrencyValue amount={selected.expected_impact.savings_annual} currency={currency} />
                        </p>
                      </div>
                    )}
                    {selected.contract_value_annual != null && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Contract Value</p>
                        <p className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                          <CurrencyValue amount={selected.contract_value_annual} currency={currency} />
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confidence meter */}
                {selected.confidence != null && (
                  <div className="mt-4">
                    <RiskMeter confidence={selected.confidence} riskLevel={selected.risk_level} />
                  </div>
                )}
              </div>

              {/* Policy Evaluation */}
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={13} style={{ color: "var(--text-secondary)" }} />
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                    Policy Evaluation
                  </h3>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--bg-surface-raised)",
                      color: "var(--text-disabled)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    NOT AI — DETERMINISTIC
                  </span>
                </div>
                <PolicyRuleRow
                  label="Human Approval Required"
                  description={`Financial impact exceeds org threshold (${currency === "INR" ? `₹${Math.round(approvalThreshold * 83.5).toLocaleString("en-IN")}` : `$${approvalThreshold.toLocaleString()}`})`}
                  evaluated={
                    selected.expected_impact?.savings_annual != null
                      ? (currency === "INR"
                        ? `₹${Math.round(selected.expected_impact.savings_annual * 83.5).toLocaleString("en-IN")}`
                        : `$${Math.round(selected.expected_impact.savings_annual).toLocaleString()}`)
                      : undefined
                  }
                  threshold={currency === "INR"
                    ? `₹${Math.round(approvalThreshold * 83.5).toLocaleString("en-IN")}`
                    : `$${approvalThreshold.toLocaleString()}`}
                  passed={selected.requires_approval}
                />
                {secondThreshold && (
                  <PolicyRuleRow
                    label="Second Approver Required"
                    description={`Financial impact exceeds second approver threshold`}
                    threshold={currency === "INR"
                      ? `₹${Math.round(secondThreshold * 83.5).toLocaleString("en-IN")}`
                      : `$${secondThreshold.toLocaleString()}`}
                    passed={selected.requires_second_approver ?? false}
                  />
                )}
                <PolicyRuleRow
                  label="AI Confidence Sufficient"
                  evaluated={selected.confidence != null ? `${Math.round(selected.confidence * 100)}%` : undefined}
                  threshold="60%"
                  passed={selected.confidence != null ? selected.confidence >= 0.6 : null}
                />
              </div>

              {/* Decision History / Approval Chain */}
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>
                  Approval Chain
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "AI Analysis Completed", done: true },
                    { label: "Policy Rules Evaluated", done: true },
                    {
                      label: "Human Approval",
                      done: ["approved", "rejected", "auto_approved"].includes(selected.approval_status),
                      active: selected.approval_status === "pending",
                      status: selected.approval_status,
                    },
                    ...(selected.requires_second_approver ? [{
                      label: "Second Approver",
                      done: false,
                      active: selected.approval_status === "approved",
                      isWarning: true,
                    }] : []),
                    { label: "Action Execution", done: selected.approval_status === "approved" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: step.done ? "var(--status-success-muted)" : step.active ? "var(--accent-muted)" : "var(--bg-surface-raised)",
                          border: `1px solid ${step.done ? "var(--status-success-border)" : step.active ? "var(--accent-border)" : "var(--border-subtle)"}`,
                        }}
                      >
                        {step.done
                          ? <CheckCircle2 size={11} style={{ color: "var(--status-success)" }} />
                          : step.active
                          ? <Clock size={11} style={{ color: "var(--accent)" }} />
                          : <div className="w-2 h-2 rounded-full" style={{ background: "var(--border-subtle)" }} />
                        }
                      </div>
                      <span className="text-sm" style={{ color: step.done ? "var(--status-success)" : step.active ? "var(--text-primary)" : "var(--text-disabled)" }}>
                        {step.label}
                      </span>
                      {(step as any).isWarning && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--status-warning-muted)", color: "var(--status-warning)" }}>
                          Required
                        </span>
                      )}
                      {step.active && (
                        <span className="text-xs" style={{ color: "var(--accent)" }}>· Awaiting your decision</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selected.approval_status === "pending" && (
                <div
                  className="rounded-md p-5"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>
                    Your Decision
                  </h3>
                  {selected.requires_second_approver && (
                    <div
                      className="mb-4 px-4 py-3 rounded-md text-sm flex items-start gap-2"
                      style={{
                        background: "var(--status-warning-muted)",
                        border: "1px solid var(--status-warning-border)",
                        color: "var(--status-warning)",
                      }}
                    >
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>This decision requires a second approver. Your approval will initiate the next review stage.</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selected.id)}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                      style={{ background: "var(--status-success)", color: "#fff" }}
                    >
                      <CheckCircle2 size={15} />
                      {actionLoading === "approve" ? "Approving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(selected.id)}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--status-danger-border)",
                        color: "var(--status-danger)",
                      }}
                    >
                      <XCircle size={15} />
                      {actionLoading === "reject" ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                  <Link
                    href={`/contracts/${selected.contract_id}`}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-xs transition-colors"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <FileText size={12} /> View Full Contract Analysis
                  </Link>
                </div>
              )}

              {selected.approval_status !== "pending" && (
                <div
                  className="flex items-center gap-3 px-5 py-4 rounded-md"
                  style={{
                    background: selected.approval_status === "approved" ? "var(--status-success-muted)" : "var(--status-danger-muted)",
                    border: `1px solid ${selected.approval_status === "approved" ? "var(--status-success-border)" : "var(--status-danger-border)"}`,
                  }}
                >
                  {selected.approval_status === "approved"
                    ? <CheckCircle2 size={18} style={{ color: "var(--status-success)" }} />
                    : <XCircle size={18} style={{ color: "var(--status-danger)" }} />}
                  <p className="text-sm font-semibold" style={{ color: selected.approval_status === "approved" ? "var(--status-success)" : "var(--status-danger)" }}>
                    Decision {selected.approval_status === "approved" ? "Approved" : "Rejected"}
                    {selected.decided_at ? ` — ${new Date(selected.decided_at).toLocaleString()}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
