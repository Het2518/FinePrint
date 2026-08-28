"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Shield, Wifi, WifiOff, Save, CheckCircle,
  Sliders, Info, HardDrive, Mail, MessageSquare, ShieldCheck,
} from "lucide-react";

const MCP_SERVERS = [
  {
    key: "google_drive",
    label: "Google Drive",
    icon: HardDrive,
    description: "Ingest contracts from shared Drive folders",
  },
  {
    key: "gmail",
    label: "Gmail",
    icon: Mail,
    description: "Pick up contracts from email attachments",
  },
  {
    key: "slack",
    label: "Slack",
    icon: MessageSquare,
    description: "Send approval alerts and action messages",
  },
  {
    key: "okta",
    label: "Okta",
    icon: ShieldCheck,
    description: "Usage / seat data for risk scoring (optional)",
  },
];

export default function SettingsPage() {
  const [connections, setConnections] = useState<
    Record<string, { url: string; status: string; scopes: string[] }>
  >({
    google_drive: { url: "", status: "mock", scopes: [] },
    gmail: { url: "", status: "mock", scopes: [] },
    slack: { url: "", status: "mock", scopes: [] },
    okta: { url: "", status: "mock", scopes: [] },
  });

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [mockMode] = useState(false);

  const loadConnections = useCallback(async () => {
    if (mockMode) return;
    try {
      const data = await api.listMcpConnections();
      const newConns = { ...connections };
      for (const item of data) {
        newConns[item.server_type] = {
          url: item.url || "",
          status: item.status || "disconnected",
          scopes: item.scopes_granted || [],
        };
      }
      setConnections(newConns);
    } catch (err) {
      console.error(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConnections();
  }, [loadConnections]);

  const [thresholds, setThresholds] = useState({
    approval_threshold_usd: 5000,
    second_approver_threshold_usd: 50000,
    llm_confidence_threshold: 0.6,
    verification_days: 30,
    scan_schedule_cron: "0 2 * * *",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getOrgSettings();
        if (data) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setThresholds({
            approval_threshold_usd: data.approval_threshold_usd ?? 5000,
            second_approver_threshold_usd:
              data.second_approver_threshold_usd ?? 50000,
            llm_confidence_threshold: 0.6,
            verification_days: 30,
            scan_schedule_cron: "0 2 * * *",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const showToast = (
    msg: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveThresholds = async () => {
    try {
      await api.updateOrgSettings({
        approval_threshold_usd: thresholds.approval_threshold_usd,
        second_approver_threshold_usd:
          thresholds.second_approver_threshold_usd,
      });
      showToast("Settings saved successfully");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : String(err),
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 rounded-md px-5 py-3 text-sm animate-slide-up"
          style={{
            background: "var(--bg-surface)",
            border: `1px solid ${
              toast.type === "success"
                ? "var(--status-success-border)"
                : "var(--status-danger-border)"
            }`,
            color:
              toast.type === "success"
                ? "var(--status-success)"
                : "var(--status-danger)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Configure MCP connections, business rules, and system preferences
        </p>
      </div>

      {/* Mock Mode Banner */}
      {mockMode && (
        <div
          className="mb-6 p-4 rounded-md flex items-start gap-3"
          style={{
            background: "var(--accent-muted)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <Info
            size={16}
            className="mt-0.5 shrink-0"
            style={{ color: "var(--accent)" }}
          />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              Mock MCP Mode Active
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              <code
                className="px-1 rounded text-xs"
                style={{ background: "var(--accent-muted)" }}
              >
                MOCK_MCP=true
              </code>{" "}
              in your{" "}
              <code
                className="px-1 rounded text-xs"
                style={{ background: "var(--accent-muted)" }}
              >
                .env
              </code>
              . Set to{" "}
              <code
                className="px-1 rounded text-xs"
                style={{ background: "var(--accent-muted)" }}
              >
                false
              </code>{" "}
              and add real MCP server URLs to go live.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — MCP Connections */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-md overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                }}
              >
                <Wifi size={16} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  MCP Connections
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  All external data access goes through MCP (ADR-001)
                </p>
              </div>
            </div>

            <div>
              {MCP_SERVERS.map(({ key, label, icon: Icon, description }, idx) => {
                const conn = connections[key];
                const isConnected =
                  conn.status === "connected" || conn.status === "active";
                return (
                  <div
                    key={key}
                    className="p-5"
                    style={{
                      borderBottom:
                        idx < MCP_SERVERS.length - 1
                          ? "1px solid var(--border-subtle)"
                          : undefined,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center mt-0.5 shrink-0"
                        style={{
                          background: "var(--bg-surface-raised)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {label}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              color: isConnected
                                ? "var(--status-success)"
                                : conn.status === "mock"
                                  ? "var(--accent)"
                                  : "var(--status-neutral)",
                              background: isConnected
                                ? "var(--status-success-muted)"
                                : conn.status === "mock"
                                  ? "var(--accent-muted)"
                                  : "var(--status-neutral-muted)",
                            }}
                          >
                            {conn.status === "mock"
                              ? "Mock (Dev)"
                              : conn.status}
                          </span>
                        </div>
                        <p
                          className="text-xs mb-3"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            value={conn.url}
                            onChange={(e) =>
                              setConnections((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  url: e.target.value,
                                },
                              }))
                            }
                            placeholder={`mcp://${key}-server:port`}
                            disabled={mockMode}
                            className="flex-1 px-3 py-2 rounded-md text-xs font-mono outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: "var(--input-bg)",
                              border: "1px solid var(--input-border)",
                              color: "var(--text-primary)",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--input-focus-border)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--input-border)";
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (isConnected) {
                                try {
                                  await api.disconnectMcpServer(key);
                                  showToast(`Disconnected ${label}`);
                                  loadConnections();
                                } catch (err) {
                                  showToast(
                                    err instanceof Error
                                      ? err.message
                                      : String(err),
                                    "error"
                                  );
                                }
                              } else {
                                try {
                                  await api.connectMcpServer(key, {
                                    url: conn.url,
                                  });
                                  showToast(`Connected to ${label}`);
                                  loadConnections();
                                } catch (err) {
                                  showToast(
                                    err instanceof Error
                                      ? err.message
                                      : String(err),
                                    "error"
                                  );
                                }
                              }
                            }}
                            disabled={
                              mockMode ||
                              (!conn.url && !isConnected)
                            }
                            className="px-3 py-2 rounded-md text-xs font-medium text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background: isConnected
                                ? "var(--status-danger)"
                                : "var(--status-success)",
                            }}
                          >
                            {isConnected ? "Disconnect" : "Connect"}
                          </button>
                        </div>

                        {/* Scopes */}
                        {isConnected && !mockMode && (
                          <div
                            className="mt-3 p-3 rounded-md"
                            style={{
                              background: "var(--bg-surface-raised)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <label
                              className="text-[10px] font-semibold uppercase tracking-widest block mb-2"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Allowed Scopes (Tools)
                            </label>
                            <div className="flex gap-2">
                              <input
                                value={
                                  conn.scopes
                                    ? conn.scopes.join(", ")
                                    : ""
                                }
                                onChange={(e) => {
                                  const scopes = e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  setConnections((prev) => ({
                                    ...prev,
                                    [key]: { ...prev[key], scopes },
                                  }));
                                }}
                                placeholder="e.g. list_files, read_file"
                                className="flex-1 px-3 py-1.5 rounded-md text-xs font-mono outline-none transition-colors"
                                style={{
                                  background: "var(--input-bg)",
                                  border: "1px solid var(--input-border)",
                                  color: "var(--text-primary)",
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor =
                                    "var(--input-focus-border)";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor =
                                    "var(--input-border)";
                                }}
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    await api.updateMcpScopes(key, {
                                      scopes: conn.scopes || [],
                                    });
                                    showToast("Scopes updated");
                                    loadConnections();
                                  } catch (err) {
                                    showToast(
                                      err instanceof Error
                                        ? err.message
                                        : String(err),
                                      "error"
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                style={{
                                  background: "var(--accent)",
                                  color: "var(--accent-text)",
                                }}
                              >
                                Save Scopes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Connection indicator dot */}
                      <span
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          isConnected || conn.status === "mock"
                            ? "animate-pulse-glow"
                            : ""
                        }`}
                        style={{
                          background: isConnected
                            ? "var(--status-success)"
                            : conn.status === "mock"
                              ? "var(--accent)"
                              : "var(--text-disabled)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — Business Rules */}
        <div className="space-y-4">
          <div
            className="rounded-md overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{
                  background: "var(--status-warning-muted)",
                  color: "var(--status-warning)",
                }}
              >
                <Sliders size={16} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Business Rules
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Deterministic thresholds (no LLM)
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Approval Threshold */}
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-widest block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Approval Threshold (USD)
                </label>
                <input
                  type="number"
                  value={thresholds.approval_threshold_usd}
                  onChange={(e) =>
                    setThresholds((p) => ({
                      ...p,
                      approval_threshold_usd: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-focus-border)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                  }}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Decisions above this require human approval
                </p>
              </div>

              {/* Second Approver Threshold */}
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-widest block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Second Approver Threshold (USD)
                </label>
                <input
                  type="number"
                  value={thresholds.second_approver_threshold_usd}
                  onChange={(e) =>
                    setThresholds((p) => ({
                      ...p,
                      second_approver_threshold_usd: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-focus-border)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                  }}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Decisions above this require an extra approval step
                </p>
              </div>

              {/* LLM Confidence Threshold */}
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-widest block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  LLM Confidence Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={thresholds.llm_confidence_threshold}
                    onChange={(e) =>
                      setThresholds((p) => ({
                        ...p,
                        llm_confidence_threshold: Number(e.target.value),
                      }))
                    }
                    className="flex-1"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <span
                    className="text-sm font-mono tabular-nums w-10 text-right"
                    style={{ color: "var(--accent)" }}
                  >
                    {Math.round(
                      thresholds.llm_confidence_threshold * 100
                    )}
                    %
                  </span>
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Below this triggers manual review flag
                </p>
              </div>

              {/* Verification Period */}
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-widest block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Verification Period (days)
                </label>
                <input
                  type="number"
                  value={thresholds.verification_days}
                  onChange={(e) =>
                    setThresholds((p) => ({
                      ...p,
                      verification_days: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-focus-border)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                  }}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Days after action to check outcome
                </p>
              </div>

              {/* Scan Schedule */}
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-widest block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Scan Schedule (Cron)
                </label>
                <input
                  value={thresholds.scan_schedule_cron}
                  onChange={(e) =>
                    setThresholds((p) => ({
                      ...p,
                      scan_schedule_cron: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-md text-xs font-mono outline-none transition-colors"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="0 2 * * *"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-focus-border)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                  }}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Default: 2am daily
                </p>
              </div>

              <button
                onClick={saveThresholds}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{ background: "var(--accent)", color: "var(--accent-text)" }}
              >
                <Save size={14} />
                Save Settings
              </button>
            </div>
          </div>

          {/* Security info */}
          <div
            className="rounded-md p-5"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: "var(--accent)" }} />
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-primary)" }}
              >
                Security
              </p>
            </div>
            <ul className="space-y-2">
              {[
                "Credentials encrypted AES-256 at rest",
                "Row-level org isolation on all queries",
                "All MCP calls logged to audit trail",
                "JWT tokens expire after 24h",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <CheckCircle
                    size={12}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--status-success)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
