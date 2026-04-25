import type { HTMLAttributes } from "react";

interface ActionFieldProps {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}

export function ActionField({
  label,
  placeholder,
  value,
  onChange,
  error,
  inputMode,
}: ActionFieldProps) {
  return (
    <div>
      <label className="text-sm text-text-secondary">{label}</label>
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
