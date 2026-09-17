interface MetricCardProps {
  title: string;
  value: number;
  variant?: string;
}

export default function MetricCard({ title, value, variant = "" }: MetricCardProps) {
  return (
    <article className={`metric-card surface ${variant}`}>
      <h3>{title}</h3>
      <strong>{value}</strong>
    </article>
  );
}
