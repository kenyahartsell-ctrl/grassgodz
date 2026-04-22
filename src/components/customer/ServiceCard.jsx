import { Scissors, Wind, Sprout, Snowflake, CircleDot, Crop, ArrowRight } from 'lucide-react';

const ICONS = { Scissors, Wind, Sprout, Snowflake, CircleDot, Crop };

export default function ServiceCard({ service, onSelect }) {
  const Icon = ICONS[service.icon] || Scissors;

  return (
    <button
      onClick={() => onSelect(service)}
      className="group text-left bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="text-primary w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-sm">{service.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">From ${service.base_price_estimate}</span>
        <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}