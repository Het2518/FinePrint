import { cn } from "@/lib/utils";

type Severity = "high" | "medium" | "low" | "none" | string;

const config: Record<string, { label: string; classes: string; dot: string }> = {
  high:   { label: "High Risk",   classes: "bg-red-500/15 text-red-400 border border-red-500/20",     dot: "bg-red-400" },
  medium: { label: "Medium Risk", classes: "bg-amber-500/15 text-amber-400 border border-amber-500/20", dot: "bg-amber-400" },
  low:    { label: "Low Risk",    classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400" },
  none:   { label: "No Risk",     classes: "bg-slate-500/15 text-slate-400 border border-slate-500/20", dot: "bg-slate-400" },
};

export default function RiskBadge({ level }: { level: Severity }) {
  const c = config[level] ?? config.none;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", c.classes)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", level === "high" ? "pulse-soft" : "", c.dot)} />
      {c.label}
    </span>
  );
}
