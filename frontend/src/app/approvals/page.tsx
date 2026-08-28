"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import {
  Check, X, Clock, DollarSign, AlertTriangle, Cpu, RefreshCw,
  Ban, Handshake, RotateCcw, Eye,
} from "lucide-react";
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
  requires_second_approver?: boolean;
  approval_status: string;
  decided_at: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }>; color: string }
> = {
  cancel: { label: "Cancel", icon: Ban, color: "var(--status-danger)" },
  renegotiate_seats: { label: "Renegotiate", icon: Handshake, color: "var(--status-warning)" },
  renew: { label: "Renew", icon: RotateCcw, color: "var(--status-success)" },
  manual_review: { label: "Review", icon: Eye, color: "var(--status-neutral)" },
};

export default function ApprovalsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");
  const [toast, setToast] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listDecisions(filter);
      setDecisions(data.decisions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const approve = async (id: string) => {
    setActing(id);
    try {
      await api.approveDecision(id);
      showToast("Decision approved -- action draft generated");
      setConfirmingId(null);
      await load();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      await api.rejectDecision(id);
      showToast("Decision rejected");
      setConfirmingId(null);
      await load();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setActing(null);
    }
  };

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const filterTabs = ["pending", "approved", "rejected", "auto_approved"];

  return (
    <div className="min-h-screen p-6 lg:p-8 relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 rounded-md px-5 py-3 text-sm animate-slide-up"
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
            Approval Queue
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Review AI recommendations before any action is taken
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

      {/* Filter tabs — underline style */}
      <div
        className="flex gap-0 mb-6"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {filterTabs.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="relative px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
            style={{
              color: filter === s ? "var(--accent)" : "var(--text-tertiary)",
            }}
          >
            {s.replace("_", " ")}
            {filter === s && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "var(--accent)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Decision Cards */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-md p-6 skeleton"
              style={{ height: "160px" }}
            />
          ))
        ) : decisions.length === 0 ? (
          <div
            className="rounded-md p-12 text-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Cpu
              size={36}
              className="mx-auto mb-4"
              style={{ color: "var(--text-disabled)" }}
            />
            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
              No {filter.replace("_", " ")} decisions
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              {filter === "pending"
                ? "All caught up. Upload and scan a contract to generate decisions."
                : "Nothing here yet."}
            </p>
          </div>
        ) : (
          decisions.map((d) => {
            const actionCfg =
              ACTION_CONFIG[d.recommended_action] || ACTION_CONFIG.manual_review;
            const ActionIcon = actionCfg.icon;
            const confidence = d.confidence != null ? Math.round(d.confidence * 100) : null;
            const isConfirming = confirmingId === d.id;

            return (
              <div
                key={d.id}
                className="rounded-md overflow-hidden animate-slide-up transition-colors duration-150"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid var(--border-subtle)`,
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-4 p-5"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <ActionIcon size={16} style={{ color: actionCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className="text-sm font-semibold capitalize"
                        style={{ color: actionCfg.color }}
                      >
                        {actionCfg.label}
                      </span>
                      {d.risk_level && <RiskBadge level={d.risk_level} />}
                      {/* Confidence gauge */}
                      {confidence !== null && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-12 h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--bg-surface-raised)" }}
                          >
                            <div
                              className="h-full rounded-full animate-gauge-fill"
                              style={{
                                width: `${confidence}%`,
                                background: "var(--accent)",
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono tabular-nums"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {confidence}%
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(d.decided_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Expected savings */}
                  {d.expected_impact?.savings_annual > 0 && (
                    <div className="text-right shrink-0">
                      <p
                        className="text-[11px] mb-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Potential Saving
                      </p>
                      <p
                        className="text-lg font-bold font-mono tabular-nums"
                        style={{ color: "var(--status-success)" }}
                      >
                        {fmtUSD(d.expected_impact.savings_annual)}
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          /yr
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Situation
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {d.situation || "--"}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Root Cause
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {d.root_cause || "--"}
                    </p>
                  </div>
                  {d.expected_impact?.description && (
                    <div
                      className="col-span-full p-3 rounded-md"
                      style={{ background: "var(--bg-surface-raised)" }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {d.expected_impact.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{
                    borderTop: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface-raised)",
                  }}
                >
                  <Link
                    href={`/contracts/${d.contract_id}`}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "var(--accent)" }}
                  >
                    View Contract
                  </Link>

                  {filter === "pending" && (
                    <div className="flex gap-3">
                      {/* Inline confirmation for second approver */}
                      {isConfirming ? (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--status-warning)" }}
                          >
                            Confirm approval?
                          </span>
                          <button
                            onClick={() => approve(d.id)}
                            disabled={acting === d.id}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
                            style={{
                              background: "var(--status-success)",
                              color: "#fff",
                            }}
                          >
                            Yes, approve
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => reject(d.id)}
                            disabled={acting === d.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40"
                            style={{
                              background: "transparent",
                              color: "var(--status-danger)",
                              border: "1px solid var(--status-danger-border)",
                            }}
                          >
                            <X size={14} />
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              if (d.requires_second_approver) {
                                setConfirmingId(d.id);
                              } else {
                                approve(d.id);
                              }
                            }}
                            disabled={acting === d.id}
                            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40"
                            style={{
                              background: "var(--accent)",
                              color: "var(--accent-text)",
                            }}
                          >
                            <Check size={14} />
                            {acting === d.id ? "Approving..." : "Approve"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {filter !== "pending" && (
                    <span
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        color:
                          d.approval_status === "approved"
                            ? "var(--status-success)"
                            : d.approval_status === "auto_approved"
                              ? "var(--accent)"
                              : "var(--status-danger)",
                        background:
                          d.approval_status === "approved"
                            ? "var(--status-success-muted)"
                            : d.approval_status === "auto_approved"
                              ? "var(--accent-muted)"
                              : "var(--status-danger-muted)",
                      }}
                    >
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
