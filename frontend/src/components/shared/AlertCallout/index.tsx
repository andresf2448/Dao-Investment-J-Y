import { AlertTriangle } from "lucide-react";

interface AlertCalloutProps {
  title: string;
}

export function AlertCallout({ title }: AlertCalloutProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-yellow-800">
      <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-700" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">
        {title}
      </p>
    </div>
  );
}
