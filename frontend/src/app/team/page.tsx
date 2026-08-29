"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Plus, Trash2, Shield, Eye, UserCheck, X, Check, AlertTriangle } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  admin:  { label: "Admin",  color: "var(--status-danger)",   icon: Shield },
  user:   { label: "Member", color: "var(--accent)",          icon: UserCheck },
  viewer: { label: "Viewer", color: "var(--text-tertiary)",   icon: Eye },
};

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "user" });
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [teamData, meData] = await Promise.all([
        (api as any).listTeam(),
        api.me(),
      ]);
      setMembers(teamData.members ?? []);
      setMe(meData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await (api as any).inviteUser(inviteForm);
      setInviteResult(res);
      await load();
    } catch (e: any) {
      setInviteResult({ error: e.message });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      await (api as any).updateUserRole(userId, { role });
      await load();
    } finally { setActionLoading(null); }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this user from the org?")) return;
    setActionLoading(userId);
    try {
      await (api as any).removeUser(userId);
      await load();
    } finally { setActionLoading(null); }
  };

  const isAdmin = me?.role === "admin";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""} in your org
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowInvite(true); setInviteResult(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            <Plus size={14} /> Invite Member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Invite New Member</h2>
            <button onClick={() => setShowInvite(false)} style={{ color: "var(--text-tertiary)" }}><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Email address"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              className="col-span-2 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
            <input
              placeholder="Full name (optional)"
              value={inviteForm.full_name}
              onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            >
              <option value="admin">Admin</option>
              <option value="user">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {inviteResult && (
            <div className={`p-3 rounded-lg text-xs ${inviteResult.error ? "text-red-400" : ""}`}
              style={{ background: inviteResult.error ? "var(--status-danger-muted)" : "var(--status-success-muted)", color: inviteResult.error ? "var(--status-danger)" : "var(--status-success)" }}>
              {inviteResult.error ? `❌ ${inviteResult.error}` : (
                <>✅ User created · Temp password: <code className="font-mono">{inviteResult.temp_password}</code></>
              )}
            </div>
          )}

          <button
            onClick={handleInvite}
            disabled={!inviteForm.email || inviteLoading}
            className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            {inviteLoading ? "Inviting…" : "Send Invite"}
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
        <div
          className="grid grid-cols-5 gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: "var(--bg-surface-raised)", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span className="col-span-2">Member</span>
          <span>Role</span>
          <span className="text-right">Joined</span>
          {isAdmin && <span className="text-right">Actions</span>}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded skeleton" />)}</div>
        ) : (
          members.map((m, i) => {
            const rCfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.viewer;
            const RIcon = rCfg.icon;
            const isMe = m.id === me?.id;
            return (
              <div
                key={m.id}
                className="grid grid-cols-5 gap-4 px-5 py-4 items-center"
                style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-raised)", borderBottom: "1px solid var(--border-subtle)" }}
              >
                {/* Avatar + name */}
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                    {(m.full_name?.[0] ?? m.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {m.full_name || m.email.split("@")[0]}
                      {isMe && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>You</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-1.5">
                  <RIcon size={11} style={{ color: rCfg.color }} />
                  <span className="text-xs font-medium" style={{ color: rCfg.color }}>{rCfg.label}</span>
                </div>

                {/* Joined */}
                <p className="text-xs text-right" style={{ color: "var(--text-tertiary)" }}>
                  {m.created_at ? new Date(m.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                </p>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-2">
                    {!isMe && (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          disabled={actionLoading === m.id}
                          className="text-xs px-2 py-1 rounded outline-none"
                          style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                        >
                          <option value="admin">Admin</option>
                          <option value="user">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRemove(m.id)}
                          disabled={actionLoading === m.id}
                          className="p-1.5 rounded transition-colors disabled:opacity-50"
                          style={{ color: "var(--status-danger)" }}
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!isAdmin && (
        <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
          <AlertTriangle size={11} className="inline mr-1" />
          Only admins can invite or remove members.
        </p>
      )}
    </div>
  );
}
