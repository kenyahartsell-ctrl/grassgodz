import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { RotateCcw } from 'lucide-react';

export default function AdminPaymentsTable({ payments, onRefund }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Job ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Platform Fee</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(p => (
            <TableRow key={p.id}>
              <TableCell className="text-sm">{format(new Date(p.created_date), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-sm font-mono text-xs">{p.job_id?.slice(0, 8)}...</TableCell>
              <TableCell className="font-medium">${p.amount?.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">${p.platform_fee?.toFixed(2)}</TableCell>
              <TableCell className="text-sm">${p.payout_amount?.toFixed(2)}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell>
                {(p.status === 'captured' || p.status === 'authorized') && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onRefund(p)}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refund
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}