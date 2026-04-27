import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import StarRating from '@/components/shared/StarRating';
import { Check, Ban, ShieldCheck, AlertCircle, Eye, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ProviderDetailModal from './ProviderDetailModal';

const STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'more_info_needed', label: 'More Info Needed' },
  { value: 'background_check_pending', label: 'BG Check Pending' },
  { value: 'background_check_failed', label: 'BG Check Failed' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminProvidersTable({ providers, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const updateStatus = async (provider, newStatus) => {
    setLoadingId(provider.id);
    try {
      await base44.entities.ProviderProfile.update(provider.id, { status: newStatus });
      toast.success(`${provider.name || provider.user_email} → ${newStatus}`);
      onRefresh?.();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setLoadingId(null);
    }
  };

  const initiateBackgroundCheck = async (provider) => {
    setLoadingId(provider.id + '_bg');
    try {
      const res = await base44.functions.invoke('initiateBackgroundCheck', { provider_profile_id: provider.id });
      toast.success('Background check initiated.');
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate background check.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
    {selectedProvider && <ProviderDetailModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />}
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Provider</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>BG Check</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map(p => (
            <React.Fragment key={p.id}>
              <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`} />
                    <div>
                      <p className="font-medium text-sm">{p.business_name || p.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{p.user_email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{p.years_experience ? `${p.years_experience} yrs` : '—'}</TableCell>
                <TableCell>
                  {p.avg_rating > 0 ? <StarRating rating={Math.round(p.avg_rating)} size="sm" /> : <span className="text-sm text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.background_check_status === 'clear' ? 'bg-green-100 text-green-700' :
                    p.background_check_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    p.background_check_status === 'consider' ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {p.background_check_status || 'not started'}
                  </span>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <select
                    value={p.status}
                    onChange={e => updateStatus(p, e.target.value)}
                    disabled={loadingId === p.id}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10" onClick={() => setSelectedProvider(p)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                    {p.consented_background_check && !['clear', 'pending'].includes(p.background_check_status) && (
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 text-xs text-blue-600 hover:bg-blue-50"
                        disabled={loadingId === p.id + '_bg'}
                        onClick={() => initiateBackgroundCheck(p)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Run BG Check
                      </Button>
                    )}
                    {p.status !== 'active' && p.status !== 'background_check_pending' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => updateStatus(p, p.background_check_status === 'clear' ? 'active' : 'background_check_pending')}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    )}
                    {p.status !== 'suspended' && p.status !== 'rejected' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => updateStatus(p, 'suspended')}>
                        <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* Expanded detail row */}
              {expandedId === p.id && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/20 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{p.phone || '—'}</span></div>
                      <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{p.dob || '—'}</span></div>
                      <div><span className="text-muted-foreground">Home Address:</span> <span className="font-medium">{p.home_address || '—'}</span></div>
                      <div><span className="text-muted-foreground">DL State:</span> <span className="font-medium">{p.dl_state || '—'}</span></div>
                      <div><span className="text-muted-foreground">DL #:</span> <span className="font-medium">{p.dl_number || '—'}</span></div>
                      <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{p.has_vehicle ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-muted-foreground">Equipment:</span> <span className="font-medium">{p.has_equipment ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-muted-foreground">Emerg. Contact:</span> <span className="font-medium">{p.emergency_contact_name} {p.emergency_contact_phone}</span></div>
                      <div><span className="text-muted-foreground">Service ZIPs:</span> <span className="font-medium">{(p.service_zip_codes || []).join(', ') || '—'}</span></div>
                      <div><span className="text-muted-foreground">BG Consent:</span> <span className={`font-medium ${p.consented_background_check ? 'text-green-600' : 'text-red-500'}`}>{p.consented_background_check ? `Yes — ${p.consent_timestamp ? new Date(p.consent_timestamp).toLocaleString() : ''}` : 'No'}</span></div>
                      <div><span className="text-muted-foreground">Signature:</span> <span className="font-medium italic">{p.signature || '—'}</span></div>
                    </div>
                    {p.bio && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground font-medium">Bio: </span>
                        <span className="text-sm">{p.bio}</span>
                      </div>
                    )}
                    {!p.consented_background_check && (
                      <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                        <AlertCircle size={13} />
                        No background check consent on record. Cannot run check without written authorization (FCRA).
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
}