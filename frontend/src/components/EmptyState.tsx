"use client";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-10 px-4" : "py-20 px-6"
      }`}
    >
      {icon && (
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center mb-3"
          style={{
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-disabled)",
          }}
        >
          {icon}
        </div>
      )}
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </p>
      {description && (
        <p
          className="text-xs max-w-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
