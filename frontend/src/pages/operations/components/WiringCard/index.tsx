type StatusTone = "success" | "warning" | "neutral" | "danger";

interface WiringCardProps {
  title: string;
  description: string;
  action: string;
  value: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  actionDisabled?: boolean;
  error?: string;
  statusMessage?: string;
  statusTone?: StatusTone;
  onAction?: () => void | Promise<void>;
}

export function WiringCard({
  title,
  description,
  action,
  value,
  inputValue,
  onInputChange,
  actionDisabled,
  error,
  statusMessage,
  statusTone = "neutral",
  onAction,
}: WiringCardProps) {
  const statusToneClasses: Record<StatusTone, string> = {
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-gray-200 bg-gray-50 text-text-secondary",
  };

  return (
    <div className="rounded-2xl border border-border px-5 py-5">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>

      <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-text-secondary">
        {value}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange?.(event.target.value)}
          placeholder="Contract address"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm"
        />
        <button
          className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionDisabled}
          onClick={onAction}
        >
          {action}
        </button>
      </div>
      {statusMessage ? (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${statusToneClasses[statusTone]}`}
        >
          {statusMessage}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
