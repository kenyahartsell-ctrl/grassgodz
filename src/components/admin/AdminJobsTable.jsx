import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import PhotoLightbox from '@/components/shared/PhotoLightbox';
import { format } from 'date-fns';
import { Camera, Pencil, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function PriceCell({ job }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(job.final_price ?? job.quoted_price ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) { toast.error('Invalid price'); return; }
    setSaving(true);
    try {
      const platform_fee = parseFloat((price * 0.25).toFixed(2));
      const provider_payout = parseFloat((price * 0.75).toFixed(2));
      await base44.entities.Job.update(job.id, {
        final_price: price,
        quoted_price: price,
        platform_fee,
        provider_payout,
      });
      job.final_price = price;
      job.quoted_price = price;
      job.platform_fee = platform_fee;
      job.provider_payout = provider_payout;
      toast.success('Price updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-20 border border-input rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        />
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-600" onClick={handleSave} disabled={saving}>
          <Check size={12} />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => setEditing(false)}>
          <X size={12} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="text-sm font-medium">
        {job.final_price ? `$${job.final_price.toFixed(2)}` : job.quoted_price ? `$${job.quoted_price.toFixed(2)}` : '—'}
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-5 w-5 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
        title="Edit price"
      >
        <Pencil size={10} />
      </Button>
    </div>
  );
}

export default function AdminJobsTable({ jobs, onUpdateStatus }) {
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Service</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map(job => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.service_name}</TableCell>
              <TableCell className="text-sm">{job.customer_name}</TableCell>
              <TableCell className="text-sm">{job.provider_name || '—'}</TableCell>
              <TableCell className="text-sm">
                {job.scheduled_date ? format(new Date(job.scheduled_date), 'MMM d') : '—'}
              </TableCell>
              <TableCell><PriceCell job={job} /></TableCell>
              <TableCell><StatusBadge status={job.status} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {job.completion_photos && Object.keys(job.completion_photos).length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                      onClick={() => setSelectedPhotos(job.completion_photos)}
                    >
                      <Camera size={14} />
                    </Button>
                  )}
                  <Select onValueChange={(val) => onUpdateStatus(job, val)}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Change..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                      <SelectItem value="completed">Complete</SelectItem>
                      <SelectItem value="requested">Re-open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedPhotos && (
        <PhotoLightbox photos={selectedPhotos} onClose={() => setSelectedPhotos(null)} />
      )}
    </div>
  );
}