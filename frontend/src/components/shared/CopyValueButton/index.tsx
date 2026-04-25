import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyValueButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyValueButton({
  value,
  label = "Copy",
  className,
}: CopyValueButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === "—") {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-secondary transition hover:bg-gray-50",
        className ?? "",
      ].join(" ")}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}
