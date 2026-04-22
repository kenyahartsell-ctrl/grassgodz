import { Star } from 'lucide-react';

export default function StarRating({ rating, size = 14, showValue = false }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-100'}
        />
      ))}
      {showValue && <span className="text-sm font-semibold text-foreground ml-1">{rating}</span>}
    </span>
  );
}