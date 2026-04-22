import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, FileText } from 'lucide-react';

export default function RequestQuoteDialog({ open, onClose, service, onSubmit }) {
  const [form, setForm] = useState({
    address: '',
    zip_code: '',
    scheduled_date: '',
    customer_notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ ...form, service });
    setLoading(false);
    onClose();
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Request a Quote for {service.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Service Address</Label>
            <Input
              required
              placeholder="123 Main St, City, State"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Zip Code</Label>
            <Input
              required
              placeholder="12345"
              value={form.zip_code}
              onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Preferred Date</Label>
            <Input
              type="date"
              required
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Notes (optional)</Label>
            <Textarea
              placeholder="Any details about your yard, gate access, pets, etc."
              value={form.customer_notes}
              onChange={(e) => setForm({ ...form, customer_notes: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}