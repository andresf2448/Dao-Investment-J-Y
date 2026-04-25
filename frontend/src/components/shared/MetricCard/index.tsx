interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}

export function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <div className="card h-full min-h-[11rem]">
      <div className="card-content flex h-full flex-col">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <div className="rounded-xl bg-blue-50 p-2 text-primary">{icon}</div>
        </div>

        <p className="mt-5 min-h-[3.5rem] break-words text-3xl font-semibold leading-tight text-text-primary">
          {value}
        </p>
        <p className="mt-auto pt-2 text-sm leading-6 text-text-secondary">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
