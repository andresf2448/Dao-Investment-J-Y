interface WiringCardProps {
  title: string;
  description: string;
  action: string;
  value: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  actionDisabled?: boolean;
  error?: string;
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
  note,
  onAction,
}: WiringCardProps) {
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
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
