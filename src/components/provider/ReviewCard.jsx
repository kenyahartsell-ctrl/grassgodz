import React from 'react';
import { Card } from '@/components/ui/card';
import StarRating from '@/components/shared/StarRating';
import { format } from 'date-fns';

export default function ReviewCard({ review }) {
  return (
    <Card className="p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{review.customer_name || 'Customer'}</span>
        <span className="text-xs text-muted-foreground">{format(new Date(review.created_date), 'MMM d, yyyy')}</span>
      </div>
      <StarRating rating={review.rating} size="sm" />
      {review.comment && (
        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
      )}
    </Card>
  );
}