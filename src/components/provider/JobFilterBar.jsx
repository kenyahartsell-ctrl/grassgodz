import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PROPERTY_SIZES = ['small', 'medium', 'large'];
const GRASS_HEIGHTS = ['short', 'medium', 'overgrown'];
const FREQUENCIES = ['one-time', 'biweekly', 'weekly'];
const SERVICE_TYPES = ['Lawn Mowing', 'Leaf Removal', 'Hedge Trimming', 'Fertilization', 'Aeration', 'Snow Removal'];

export default function JobFilterBar({ filters, onFilterChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key, value) => {
    onFilterChange(prev => ({
      ...prev,
      [key]: value === prev[key] ? null : value,
    }));
  };

  const updateRangeFilter = (key, value) => {
    onFilterChange(prev => ({
      ...prev,
      [key]: value === '' ? null : Number(value),
    }));
  };

  return (
    <div className="space-y-3">
      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.priceMin || ''}
          onChange={e => updateRangeFilter('priceMin', e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Min price</option>
          <option value="25">$25+</option>
          <option value="50">$50+</option>
          <option value="75">$75+</option>
          <option value="100">$100+</option>
        </select>

        <select
          value={filters.priceMax || ''}
          onChange={e => updateRangeFilter('priceMax', e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Max price</option>
          <option value="50">Up to $50</option>
          <option value="75">Up to $75</option>
          <option value="100">Up to $100</option>
          <option value="150">Up to $150</option>
        </select>

        <select
          value={filters.maxDistance || ''}
          onChange={e => updateRangeFilter('maxDistance', e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Distance</option>
          <option value="5">5 miles</option>
          <option value="10">10 miles</option>
          <option value="15">15 miles</option>
          <option value="25">25 miles</option>
        </select>

        <select
          value={filters.serviceType || ''}
          onChange={e => updateFilter('serviceType', e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Service type</option>
          {SERVICE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 px-2.5 py-1.5"
        >
          More <ChevronDown size={12} className={showAdvanced ? 'rotate-180' : ''} />
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {PROPERTY_SIZES.map(size => (
            <button
              key={size}
              onClick={() => updateFilter('propertySize', size)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${
                filters.propertySize === size
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border hover:border-primary/40'
              }`}
            >
              {size} yard
            </button>
          ))}

          {GRASS_HEIGHTS.map(height => (
            <button
              key={height}
              onClick={() => updateFilter('grassHeight', height)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${
                filters.grassHeight === height
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border hover:border-primary/40'
              }`}
            >
              {height} grass
            </button>
          ))}

          {FREQUENCIES.map(freq => (
            <button
              key={freq}
              onClick={() => updateFilter('frequency', freq)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${
                filters.frequency === freq
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border hover:border-primary/40'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}