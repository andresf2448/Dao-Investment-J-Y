interface SummaryStatProps {
  label: string;
  value: string;
}

export function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className="flex h-full min-h-[7.5rem] flex-col rounded-2xl border border-border bg-gray-50 px-4 py-4">
      <div className="min-h-[3rem]">
        <p className="text-sm leading-6 text-text-secondary">{label}</p>
      </div>
      <p className="mt-auto pt-2 text-lg font-semibold text-text-primary">
        {value}
      </p>
    </div>
  );
}
