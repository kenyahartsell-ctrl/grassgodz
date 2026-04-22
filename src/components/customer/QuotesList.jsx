import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StarRating from '@/components/shared/StarRating';
import StatusBadge from '@/components/shared/StatusBadge';
import { DollarSign, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function QuotesList({ open, onClose, quotes, onAccept }) {
  const pendingQuotes = quotes.filter(q => q.status === 'pending');
  const otherQuotes = quotes.filter(q => q.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Quotes Received</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {pendingQuotes.length === 0 && otherQuotes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No quotes yet. Providers in your area will submit quotes soon.</p>
          )}
          {pendingQuotes.map((quote) => (
            <Card key={quote.id} className="p-4 border border-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{quote.provider_name}</p>
                  </div>
                </div>
                <StatusBadge status={quote.status} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-xl font-heading font-bold">${quote.price.toFixed(2)}</span>
              </div>
              {quote.message && (
                <p className="text-sm text-muted-foreground mb-3">{quote.message}</p>
              )}
              {quote.expires_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  Expires {format(new Date(quote.expires_at), 'MMM d, h:mm a')}
                </div>
              )}
              <Button size="sm" className="w-full" onClick={() => onAccept(quote)}>
                Accept Quote
              </Button>
            </Card>
          ))}
          {otherQuotes.map((quote) => (
            <Card key={quote.id} className="p-4 border border-border opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{quote.provider_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">${quote.price.toFixed(2)}</span>
                  <StatusBadge status={quote.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}