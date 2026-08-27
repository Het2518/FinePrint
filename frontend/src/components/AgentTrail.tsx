"use client";

interface McpCallLog {
  tool: string;
  server: string;
  result_summary: string;
  called_at: string;
}

interface AgentTrailProps {
  agentRuns: {
    id: string;
    agent_name: string;
    confidence?: number;
    reasoning_summary?: string;
    mcp_tool_calls?: McpCallLog[];
    status: string;
    started_at?: string;
    completed_at?: string;
  }[];
}

const agentColors: Record<string, string> = {
  detection: "from-indigo-500 to-blue-500",
  risk:      "from-amber-500 to-orange-500",
  finance:   "from-emerald-500 to-teal-500",
  decision:  "from-purple-500 to-pink-500",
  action:    "from-rose-500 to-red-500",
};

const agentIcons: Record<string, string> = {
  detection: "🔍",
  risk:      "⚠️",
  finance:   "💰",
  decision:  "🧠",
  action:    "⚡",
};

export default function AgentTrail({ agentRuns }: AgentTrailProps) {
  if (!agentRuns || agentRuns.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        No agent runs recorded for this contract yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agentRuns.map((run, idx) => {
        const gradient = agentColors[run.agent_name] || "from-slate-500 to-slate-600";
        const icon = agentIcons[run.agent_name] || "🤖";
        const confidence = run.confidence ? Math.round(run.confidence * 100) : null;

        return (
          <div key={run.id} className="glass rounded-xl overflow-hidden border border-white/[0.06] slide-in" style={{ animationDelay: `${idx * 60}ms` }}>
            {/* Agent header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-sm shadow-sm`}>
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white capitalize">{run.agent_name} Agent</p>
                <p className="text-xs text-slate-500">
                  {run.started_at ? new Date(run.started_at).toLocaleTimeString() : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {confidence !== null && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{confidence}%</span>
                  </div>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  run.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                  run.status === "failed" ? "bg-red-500/15 text-red-400" :
                  run.status === "low_confidence" ? "bg-amber-500/15 text-amber-400" :
                  "bg-slate-500/15 text-slate-400"
                }`}>
                  {run.status}
                </span>
              </div>
            </div>

            {/* Reasoning */}
            {run.reasoning_summary && (
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <p className="text-xs text-slate-400 leading-relaxed">{run.reasoning_summary}</p>
              </div>
            )}

            {/* MCP tool calls */}
            {run.mcp_tool_calls && run.mcp_tool_calls.length > 0 && (
              <div className="px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">MCP Tool Calls</p>
                {run.mcp_tool_calls.map((call, ci) => (
                  <div key={ci} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {call.tool}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-1 truncate">{call.result_summary}</span>
                    <span className="text-[10px] text-slate-600">{call.server}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
