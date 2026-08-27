"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Settings, Shield, Wifi, WifiOff, Plus, Trash2, Save,
  CheckCircle, AlertTriangle, Key, Sliders, Info
} from "lucide-react";

const MCP_SERVERS = [
  { key: "google_drive", label: "Google Drive", icon: "📁", description: "Ingest contracts from shared Drive folders" },
  { key: "gmail", label: "Gmail", icon: "📧", description: "Pick up contracts from email attachments" },
  { key: "slack", label: "Slack", icon: "💬", description: "Send approval alerts and action messages" },
  { key: "okta", label: "Okta", icon: "🔐", description: "Usage / seat data for risk scoring (optional)" },
];

export default function SettingsPage() {
  const [connections, setConnections] = useState<Record<string, { url: string; status: string; scopes: string[] }>>({
    google_drive: { url: "", status: "mock", scopes: [] },
    gmail:        { url: "", status: "mock", scopes: [] },
    slack:        { url: "", status: "mock", scopes: [] },
    okta:         { url: "", status: "mock", scopes: [] },
  });

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [mockMode] = useState(false); // We can default to false to see the real connections

  const loadConnections = useCallback(async () => {
    if (mockMode) return;
    try {
      const data = await api.listMcpConnections();
      const newConns = { ...connections };
      for (const item of data) {
        newConns[item.server_type] = { 
          url: item.url || "", 
          status: item.status || "disconnected",
          scopes: item.scopes_granted || []
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
            second_approver_threshold_usd: data.second_approver_threshold_usd ?? 50000,
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

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

    const saveThresholds = async () => {
      try {
        await api.updateOrgSettings({
          approval_threshold_usd: thresholds.approval_threshold_usd,
          second_approver_threshold_usd: thresholds.second_approver_threshold_usd,
        });
        showToast("Settings saved successfully");
      } catch (err) {
        showToast(err instanceof Error ? err.message : String(err), "error");
      }
    };

  return (
    <div className="min-h-screen p-8 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 glass border rounded-xl px-5 py-3 text-sm shadow-2xl slide-in ${
          toast.type === "success" ? "border-emerald-500/30 text-emerald-300" : "border-red-500/30 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure MCP connections, business rules, and system preferences</p>
      </div>

      {/* Mock Mode Banner */}
      {mockMode && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
          <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-indigo-300 font-semibold">Mock MCP Mode Active</p>
            <p className="text-xs text-indigo-400/70 mt-0.5">
              <code className="bg-indigo-500/20 px-1 rounded">MOCK_MCP=true</code> in your <code className="bg-indigo-500/20 px-1 rounded">.env</code>.
              The system uses stub responses — no live credentials needed. Set to <code className="bg-indigo-500/20 px-1 rounded">false</code> and add real MCP server URLs below to go live.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — MCP Connections */}
        <div className="col-span-2 space-y-4">
          <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Wifi size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">MCP Connections</p>
                <p className="text-xs text-slate-500">All external data access goes through MCP (ADR-001)</p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {MCP_SERVERS.map(({ key, label, icon, description }) => {
                const conn = connections[key];
                return (
                  <div key={key} className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-200">{label}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            (conn.status === "connected" || conn.status === "active") ? "bg-emerald-500/15 text-emerald-400" :
                            conn.status === "mock" ? "bg-indigo-500/15 text-indigo-400" :
                            "bg-slate-500/15 text-slate-400"
                          }`}>
                            {conn.status === "mock" ? "Mock (Dev)" : conn.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{description}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            value={conn.url}
                            onChange={(e) => setConnections(prev => ({ ...prev, [key]: { ...prev[key], url: e.target.value } }))}
                            placeholder={`mcp://${key}-server:port`}
                            disabled={mockMode}
                            className="flex-1 px-3 py-2 bg-slate-800/50 rounded-lg text-xs text-slate-300 placeholder-slate-600 border border-white/[0.07] focus:outline-none focus:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed font-mono transition-colors"
                          />
                          <button
                            onClick={async () => {
                              if (conn.status === 'active' || conn.status === 'connected') {
                                try {
                                  await api.disconnectMcpServer(key);
                                  showToast(`Disconnected ${label}`);
                                  loadConnections();
                                } catch (err) {
                                  showToast(err instanceof Error ? err.message : String(err), "error");
                                }
                              } else {
                                try {
                                  await api.connectMcpServer(key, { url: conn.url });
                                  showToast(`Connected to ${label}`);
                                  loadConnections();
                                } catch (err) {
                                  showToast(err instanceof Error ? err.message : String(err), "error");
                                }
                              }
                            }}
                            disabled={mockMode || (!conn.url && conn.status !== 'active' && conn.status !== 'connected')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${(conn.status === 'active' || conn.status === 'connected') ? 'bg-red-600/80 hover:bg-red-600' : 'bg-emerald-600/80 hover:bg-emerald-600'}`}
                          >
                            {(conn.status === 'active' || conn.status === 'connected') ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                        
                        {(conn.status === 'active' || conn.status === 'connected') && !mockMode && (
                          <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-white/[0.04]">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">
                              Allowed Scopes (Tools)
                            </label>
                            <div className="flex gap-2">
                              <input
                                value={conn.scopes ? conn.scopes.join(", ") : ""}
                                onChange={(e) => {
                                  const scopes = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                  setConnections(prev => ({ ...prev, [key]: { ...prev[key], scopes } }));
                                }}
                                placeholder="e.g. list_files, read_file"
                                className="flex-1 px-3 py-1.5 bg-slate-800 rounded text-xs text-slate-300 font-mono border border-white/[0.05] focus:outline-none focus:border-indigo-500/40"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    await api.updateMcpScopes(key, { scopes: conn.scopes || [] });
                                    showToast("Scopes updated");
                                    loadConnections();
                                  } catch (err) {
                                    showToast(err instanceof Error ? err.message : String(err), "error");
                                  }
                                }}
                                className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 rounded text-xs text-white transition-colors"
                              >
                                Save Scopes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        (conn.status === "connected" || conn.status === "active") ? "bg-emerald-400 pulse-soft" :
                        conn.status === "mock" ? "bg-indigo-400 pulse-soft" :
                        "bg-slate-600"
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — Business Rules */}
        <div className="col-span-1 space-y-4">
          <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Sliders size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Business Rules</p>
                <p className="text-xs text-slate-500">Deterministic thresholds (no LLM)</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                  Approval Threshold (USD)
                </label>
                <input
                  type="number"
                  value={thresholds.approval_threshold_usd}
                  onChange={(e) => setThresholds(p => ({ ...p, approval_threshold_usd: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-slate-800/50 rounded-xl text-sm text-slate-300 border border-white/[0.07] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
                <p className="text-xs text-slate-600 mt-1">Decisions above this require human approval</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                  Second Approver Threshold (USD)
                </label>
                <input
                  type="number"
                  value={thresholds.second_approver_threshold_usd}
                  onChange={(e) => setThresholds(p => ({ ...p, second_approver_threshold_usd: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-slate-800/50 rounded-xl text-sm text-slate-300 border border-white/[0.07] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
                <p className="text-xs text-slate-600 mt-1">Decisions above this require an extra approval step</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                  LLM Confidence Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={thresholds.llm_confidence_threshold}
                    onChange={(e) => setThresholds(p => ({ ...p, llm_confidence_threshold: Number(e.target.value) }))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm font-mono text-amber-400 w-10 text-right">
                    {Math.round(thresholds.llm_confidence_threshold * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Below this → manual review flag</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                  Verification Period (days)
                </label>
                <input
                  type="number"
                  value={thresholds.verification_days}
                  onChange={(e) => setThresholds(p => ({ ...p, verification_days: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-slate-800/50 rounded-xl text-sm text-slate-300 border border-white/[0.07] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
                <p className="text-xs text-slate-600 mt-1">Days after action to check outcome</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                  Scan Schedule (Cron)
                </label>
                <input
                  value={thresholds.scan_schedule_cron}
                  onChange={(e) => setThresholds(p => ({ ...p, scan_schedule_cron: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800/50 rounded-xl text-xs text-slate-300 font-mono border border-white/[0.07] focus:outline-none focus:border-amber-500/40 transition-colors"
                  placeholder="0 2 * * *"
                />
                <p className="text-xs text-slate-600 mt-1">Default: 2am daily</p>
              </div>

              <button
                onClick={saveThresholds}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-amber-500/20 transition-all"
              >
                <Save size={14} />
                Save Settings
              </button>
            </div>
          </div>

          {/* Security info */}
          <div className="glass rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-indigo-400" />
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Security</p>
            </div>
            <ul className="space-y-2">
              {[
                "Credentials encrypted AES-256 at rest",
                "Row-level org isolation on all queries",
                "All MCP calls logged to audit trail",
                "JWT tokens expire after 24h",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
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
