import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import StarRating from '@/components/shared/StarRating';
import { Check, X, Ban } from 'lucide-react';

export default function AdminProvidersTable({ providers, onApprove, onSuspend }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Business</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Jobs Done</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.business_name || '—'}</TableCell>
              <TableCell className="text-sm">{p.name || p.user_email}</TableCell>
              <TableCell className="text-sm">{p.years_experience ? `${p.years_experience} yrs` : '—'}</TableCell>
              <TableCell>
                {p.avg_rating > 0 ? <StarRating rating={Math.round(p.avg_rating)} size="sm" /> : <span className="text-sm text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-sm">{p.total_jobs_completed || 0}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {p.status === 'pending_approval' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => onApprove(p)}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {p.status !== 'suspended' ? (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => onSuspend(p, 'suspended')}>
                      <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => onSuspend(p, 'active')}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Reactivate
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}