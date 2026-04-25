import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white/70 px-6 py-8 text-center shadow-sm">
      {icon ? (
        <div className="rounded-xl bg-blue-50 p-2 text-primary">{icon}</div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
