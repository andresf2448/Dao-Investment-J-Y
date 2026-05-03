import type { HTMLAttributes } from "react";

interface ActionFieldProps {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function ActionField({
  label,
  placeholder,
  value,
  onChange,
  error,
  inputMode,
  actionLabel,
  onAction,
  actionDisabled,
}: ActionFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-text-secondary">{label}</label>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="rounded-full border border-border bg-gray-50 px-3 py-1 text-xs font-semibold text-text-primary transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
      />
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
