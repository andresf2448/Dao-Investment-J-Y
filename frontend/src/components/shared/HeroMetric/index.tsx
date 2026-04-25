interface HeroMetricProps {
  label: string;
  value: string;
}

export function HeroMetric({ label, value }: HeroMetricProps) {
  return (
    <div className="min-h-[6rem] rounded-2xl bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-sm text-blue-50">{label}</p>
      <p className="mt-2 min-h-[2.75rem] break-words text-xl font-semibold leading-tight text-white">
        {value}
      </p>
    </div>
  );
}
