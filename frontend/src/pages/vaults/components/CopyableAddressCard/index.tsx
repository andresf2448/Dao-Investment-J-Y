import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatAddress } from "@/utils";

interface CopyableAddressCardProps {
  label: string;
  value: string;
}

export function CopyableAddressCard({
  label,
  value,
}: CopyableAddressCardProps) {
  const [copied, setCopied] = useState(false);
  const displayValue = formatAddress(value);

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
    <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-sm text-blue-50">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{displayValue}</p>
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
