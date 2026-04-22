import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';

export default function AdminJobsTable({ jobs, onUpdateStatus }) {
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
              <TableCell className="text-sm font-medium">
                {job.quoted_price ? `$${job.quoted_price.toFixed(2)}` : '—'}
              </TableCell>
              <TableCell><StatusBadge status={job.status} /></TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}