export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`${bgColor} rounded-xl p-3 flex-shrink-0`}>
        <Icon className={`${color} w-5 h-5`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}