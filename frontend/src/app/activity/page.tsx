"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import TimelineEvent from "@/components/TimelineEvent";
import {
  Clock, Filter, Search, Cpu, User as UserIcon,
  Settings, Zap,
} from "lucide-react";

export default function ActivityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState<"all" | "ai" | "human">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listAuditLogs({ limit: 100 });
      setEvents(data.events ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = events.filter((e) => {
    const matchesSearch =
      !search ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      e.detail?.toLowerCase().includes(search.toLowerCase());

    const matchesActor =
      actorFilter === "all" ||
      (actorFilter === "ai" && !e.user_id) ||
      (actorFilter === "human" && !!e.user_id);

    return matchesSearch && matchesActor;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof events>>((acc, e) => {
    const date = new Date(e.timestamp).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Activity
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Immutable audit trail — all system and human events
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center gap-2 flex-1 max-w-sm px-3 py-1.5 rounded-md"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={13} style={{ color: "var(--text-disabled)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        <div
          className="flex gap-1 p-1 rounded-md"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          {[
            { key: "all", label: "All" },
            { key: "ai", label: "AI", icon: <Cpu size={11} /> },
            { key: "human", label: "Human", icon: <UserIcon size={11} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActorFilter(key as any)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: actorFilter === key ? "var(--bg-surface-raised)" : "transparent",
                color: actorFilter === key ? "var(--text-primary)" : "var(--text-tertiary)",
                border: actorFilter === key ? "1px solid var(--border-subtle)" : "1px solid transparent",
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs tabular-nums" style={{ color: "var(--text-disabled)" }}>
          {filtered.length} events
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 max-w-2xl">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-md skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Clock size={18} />}
          title="No events found"
          description={search ? "Try adjusting your search." : "Events will appear here as the system processes contracts."}
        />
      ) : (
        <div className="max-w-2xl space-y-8">
          {Object.entries(grouped).map(([date, dateEvents]) => (
            <div key={date}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2"
                style={{
                  color: "var(--text-tertiary)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                {date}
              </p>
              <div className="pt-1">
                {dateEvents.map((e, i) => (
                  <TimelineEvent
                    key={e.id}
                    action={e.action}
                    entityType={e.entity_type}
                    userId={e.user_id}
                    detail={e.detail}
                    timestamp={e.timestamp}
                    isLast={i === dateEvents.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
