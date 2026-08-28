"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import {
  Wifi, WifiOff, Shield, CheckCircle2, XCircle, RotateCcw,
  Plus, Trash2, Loader2, AlertTriangle, Save, Settings,
  DollarSign, Sliders, Link as LinkIcon,
} from "lucide-react";

type SettingsTab = "policy" | "integrations" | "organization";

const MCP_SERVERS = [
  { type: "google_drive", name: "Google Drive", description: "Read contracts from shared Drive folders" },
  { type: "gmail", name: "Gmail", description: "Ingest contracts from email attachments" },
  { type: "slack", name: "Slack", description: "Send alerts and action drafts to channels" },
  { type: "okta", name: "Okta", description: "Identity management and access control" },
];

const DEFAULT_SCOPES: Record<string, string[]> = {
  google_drive: ["search_documents", "read_file"],
  gmail: ["list_emails", "read_email"],
  slack: ["send_message", "list_channels"],
  okta: ["list_users"],
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("policy");
  const [settings, setSettings] = useState<any>(null);
  const [mcp, setMcp] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Policy form state
  const [approvalThreshold, setApprovalThreshold] = useState("");
  const [secondThreshold, setSecondThreshold] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  // MCP state
  const [connecting, setConnecting] = useState<string | null>(null);
  const [mcpUrls, setMcpUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsData, mcpData] = await Promise.all([
        api.getOrgSettings(),
        api.listMcpConnections(),
      ]);
      setSettings(settingsData);
      setApprovalThreshold(String(settingsData.approval_threshold_usd ?? 5000));
      setSecondThreshold(String(settingsData.second_approver_threshold_usd ?? ""));
      setDisplayCurrency(settingsData.display_currency ?? "USD");
      setMcp(Array.isArray(mcpData) ? mcpData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.updateOrgSettings({
        approval_threshold_usd: parseFloat(approvalThreshold) || 5000,
        second_approver_threshold_usd: secondThreshold ? parseFloat(secondThreshold) : null,
        display_currency: displayCurrency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const connectMcp = async (serverType: string) => {
    const url = mcpUrls[serverType] || "";
    if (!url) return;
    setConnecting(serverType);
    try {
      await api.connectMcpServer(serverType, { url });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setConnecting(null);
    }
  };

  const disconnectMcp = async (serverType: string) => {
    if (!confirm("Disconnect this integration?")) return;
    setConnecting(serverType);
    try {
      await api.disconnectMcpServer(serverType);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setConnecting(null);
    }
  };

  const getMcpStatus = (serverType: string) =>
    mcp.find((c) => c.server_type === serverType);

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: "policy", label: "Policy Rules", icon: <Sliders size={13} /> },
    { key: "integrations", label: "Integrations", icon: <LinkIcon size={13} /> },
    { key: "organization", label: "Organization", icon: <Settings size={13} /> },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Configure thresholds, integrations, and organization preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-44 shrink-0 space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors"
              style={{
                background: activeTab === t.key ? "var(--bg-surface)" : "transparent",
                border: activeTab === t.key ? "1px solid var(--border-subtle)" : "1px solid transparent",
                color: activeTab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">

          {/* POLICY TAB */}
          {activeTab === "policy" && (
            <div className="space-y-5">
              {/* Approval thresholds */}
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} style={{ color: "var(--accent)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Approval Thresholds
                  </h2>
                </div>
                <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
                  These thresholds are evaluated deterministically — they are never influenced by the AI. Values are stored in USD.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Human Approval Threshold (USD)
                    </label>
                    <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                      Contracts with estimated impact above this value require a human to approve before any action is taken.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>$</span>
                      <input
                        type="number"
                        value={approvalThreshold}
                        onChange={(e) => setApprovalThreshold(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-md text-sm"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--input-border)",
                          color: "var(--text-primary)",
                          outline: "none",
                        }}
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Second Approver Threshold (USD) — Optional
                    </label>
                    <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                      Contracts above this value require an additional executive approval. Leave blank to disable.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>$</span>
                      <input
                        type="number"
                        value={secondThreshold}
                        onChange={(e) => setSecondThreshold(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-md text-sm"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--input-border)",
                          color: "var(--text-primary)",
                          outline: "none",
                        }}
                        placeholder="50000 (optional)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
                  How the Rule Engine Works
                </h3>
                <div className="space-y-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[10px] px-1 rounded shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>1</span>
                    AI agents analyze the contract and estimate annual savings/exposure.
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[10px] px-1 rounded shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>2</span>
                    The deterministic rule engine (pure Python, no LLM) compares the estimate against these thresholds.
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[10px] px-1 rounded shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>3</span>
                    If above the approval threshold → the decision is sent to the Approvals queue.
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[10px] px-1 rounded shrink-0" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>4</span>
                    If above the second approver threshold → a second reviewer must also approve.
                  </div>
                </div>
              </div>

              {/* Save */}
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--accent-text)" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin-slow" /> : <Save size={14} />}
                {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Policy Rules"}
              </button>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === "integrations" && (
            <div className="space-y-4">
              {MCP_SERVERS.map((server) => {
                const conn = getMcpStatus(server.type);
                const isConnected = conn?.status === "active";
                const isLoading = connecting === server.type;

                return (
                  <div
                    key={server.type}
                    className="rounded-md p-5"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {server.name}
                          </h3>
                          <StatusBadge status={isConnected ? "connected" : "disconnected"} />
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {server.description}
                        </p>
                      </div>
                      {isConnected && (
                        <button
                          onClick={() => disconnectMcp(server.type)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                          style={{
                            border: "1px solid var(--status-danger-border)",
                            color: "var(--status-danger)",
                          }}
                        >
                          {isLoading ? <Loader2 size={11} className="animate-spin-slow" /> : <Trash2 size={11} />}
                          Disconnect
                        </button>
                      )}
                    </div>

                    {isConnected && conn?.last_verified_at && (
                      <p className="text-xs mb-3" style={{ color: "var(--text-disabled)" }}>
                        Last verified: {new Date(conn.last_verified_at).toLocaleString()}
                      </p>
                    )}

                    {!isConnected && (
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={mcpUrls[server.type] ?? ""}
                          onChange={(e) => setMcpUrls((prev) => ({ ...prev, [server.type]: e.target.value }))}
                          placeholder={`MCP server URL for ${server.name}…`}
                          className="flex-1 px-3 py-1.5 rounded-md text-sm"
                          style={{
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => connectMcp(server.type)}
                          disabled={isLoading || !mcpUrls[server.type]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
                          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                        >
                          {isLoading ? <Loader2 size={11} className="animate-spin-slow" /> : <Plus size={11} />}
                          Connect
                        </button>
                      </div>
                    )}

                    {/* Scopes */}
                    {isConnected && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                          Granted Scopes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const scopes = conn?.scopes_granted
                              ? JSON.parse(conn.scopes_granted)
                              : DEFAULT_SCOPES[server.type] ?? [];
                            return scopes.map((s: string) => (
                              <span
                                key={s}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  background: "var(--status-success-muted)",
                                  color: "var(--status-success)",
                                  border: "1px solid var(--status-success-border)",
                                }}
                              >
                                ✓ {s}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ORGANIZATION TAB */}
          {activeTab === "organization" && (
            <div className="space-y-5">
              <div
                className="rounded-md p-5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Display Preferences
                </h2>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Display Currency
                  </label>
                  <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                    Financial values will be displayed in this currency. Note: All values are stored in USD — INR uses a static display conversion and does not affect business logic.
                  </p>
                  <div className="flex gap-2">
                    {["USD", "INR"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDisplayCurrency(c)}
                        className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                        style={{
                          background: displayCurrency === c ? "var(--accent)" : "var(--bg-surface-raised)",
                          color: displayCurrency === c ? "var(--accent-text)" : "var(--text-secondary)",
                          border: `1px solid ${displayCurrency === c ? "var(--accent)" : "var(--border-subtle)"}`,
                        }}
                      >
                        {c === "USD" ? "$ USD" : "₹ INR"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--accent-text)" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin-slow" /> : <Save size={14} />}
                {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Preferences"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
