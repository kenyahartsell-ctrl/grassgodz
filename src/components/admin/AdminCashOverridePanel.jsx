import { useState } from 'react';
import { Search, CheckCircle2, XCircle, Loader2, Shield, Banknote } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminCashOverridePanel({ jobs, providers, customers, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [approving, setApproving] = useState(false);

  const activeJobs = jobs.filter(j =>
    ['requested', 'pending', 'scheduled', 'accepted', 'in_progress'].includes(j.status) &&
    !j.cash_payment_approved
  );
  const approvedJobs = jobs.filter(j => j.cash_payment_approved);

  const filteredJobs = search.length >= 2
    ? activeJobs.filter(j =>
        j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        j.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
        j.provider_name?.toLowerCase().includes(search.toLowerCase()) ||
        j.service_name?.toLowerCase().includes(search.toLowerCase())
      )
    : activeJobs.slice(0, 30);

  const verifyProvider = async (job) => {
    if (!job.provider_id) {
      toast.error('No provider assigned — assign a provider first.');
      return;
    }
    setVerifying(true);
    setVerificationResult(null);
    setSelectedJob(job);
    try {
      const requiredFee = (job.quoted_price || 0) * 0.10;
      const allJobs = await base44.entities.Job.list('-created_date', 500);
      const providerPendingJobs = allJobs.filter(j =>
        j.provider_id === job.provider_id &&
        j.id !== job.id &&
        j.status === 'completed' &&
        (j.provider_payout || 0) > 0
      );
      const totalPendingPayout = providerPendingJobs.reduce((sum, j) => sum + (j.provider_payout || 0), 0);
      const canApprove = totalPendingPayout >= requiredFee;
      const provider = providers.find(p => p.id === job.provider_id);
      setVerificationResult({
        requiredFee,
        totalPendingPayout,
        pendingJobs: providerPendingJobs,
        canApprove,
        providerName: provider?.business_name || provider?.name || job.provider_name || 'Unknown Provider',
      });
    } catch (err) {
      toast.error('Verification failed: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedJob || !verificationResult?.canApprove) return;
    setApproving(true);
    try {
      await base44.entities.Job.update(selectedJob.id, {
        cash_payment_approved: true,
        payment_method: 'cash',
        cash_override_notes: `Admin approved. Provider pending payout: $${verificationResult.totalPendingPayout.toFixed(2)}`,
      });
      const customer = customers.find(c =>
        c.user_email === selectedJob.customer_email ||
        (c.name && selectedJob.customer_name && c.name.toLowerCase() === selectedJob.customer_name.toLowerCase())
      );
      if (customer) {
        await base44.entities.CustomerProfile.update(customer.id, { allow_cash_payment: true });
      }
      toast.success(`Cash payment approved for ${selectedJob.customer_name}.`);
      setSelectedJob(null);
      setVerificationResult(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Approval failed: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Cash Payment Override</h2>
        <p className="text-sm text-muted-foreground">
          Approve cash payments after verifying the provider has pending payout ≥ 10% of the job value to cover the platform fee.
        </p>
      </div>

      {approvedJobs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-bold text-green-800 mb-2">
            ✓ {approvedJobs.length} job{approvedJobs.length !== 1 ? 's' : ''} with cash payment approved
          </p>
          <div className="space-y-1">
            {approvedJobs.slice(0, 5).map(j => (
              <div key={j.id} className="flex items-center justify-between text-xs text-green-700">
                <span>{j.service_name} — {j.customer_name}</span>
                <span className="font-semibold">${j.quoted_price || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, provider, or service…"
          className="w-full pl-9 pr-3 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-3">
        {filteredJobs.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            {search.length >= 2 ? 'No matching jobs.' : 'No active jobs pending cash override.'}
          </div>
        )}
        {filteredJobs.map(job => {
          const isSelected = selectedJob?.id === job.id;
          const fee = ((job.quoted_price || 0) * 0.10).toFixed(2);
          return (
            <div key={job.id} className={`bg-card border rounded-xl overflow-hidden ${isSelected ? 'border-primary' : 'border-border'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{job.service_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Customer: <strong>{job.customer_name}</strong></p>
                    <p className="text-xs text-muted-foreground">Provider: <strong>{job.provider_name || '—'}</strong></p>
                    {job.scheduled_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-foreground">${job.quoted_price || '—'}</p>
                    <p className="text-[11px] text-muted-foreground">10% fee: ${fee}</p>
                  </div>
                </div>
                <div className="mt-3">
                  {job.provider_id ? (
                    <Button size="sm" variant="outline" onClick={() => verifyProvider(job)}
                      disabled={verifying && isSelected}
                      className="flex items-center gap-1.5 text-xs">
                      {verifying && isSelected ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                      Verify Provider & Approve Cash
                    </Button>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium">⚠ Assign a provider first</p>
                  )}
                </div>
              </div>

              {isSelected && verificationResult && (
                <div className={`border-t px-4 py-4 ${verificationResult.canApprove ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {verificationResult.canApprove
                      ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      : <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground mb-3">
                        {verificationResult.canApprove
                          ? '✓ Verification Passed — Safe to Approve Cash'
                          : '✗ Verification Failed — Insufficient Provider Balance'}
                      </p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs mb-3">
                        <div>
                          <p className="text-muted-foreground">Provider</p>
                          <p className="font-semibold text-foreground">{verificationResult.providerName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Platform fee needed (10%)</p>
                          <p className="font-bold text-foreground">${verificationResult.requiredFee.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Provider pending payout</p>
                          <p className={`font-bold ${verificationResult.canApprove ? 'text-green-700' : 'text-red-600'}`}>
                            ${verificationResult.totalPendingPayout.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Qualifying jobs</p>
                          <p className="font-semibold text-foreground">{verificationResult.pendingJobs.length} completed</p>
                        </div>
                      </div>
                      {!verificationResult.canApprove && (
                        <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2 mb-3 text-xs text-red-700 font-medium">
                          Provider needs ${(verificationResult.requiredFee - verificationResult.totalPendingPayout).toFixed(2)} more in pending payout.
                          They must complete another job before this can be approved.
                        </div>
                      )}
                      {verificationResult.pendingJobs.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-foreground mb-1.5">Collateral jobs:</p>
                          <div className="space-y-1 text-xs">
                            {verificationResult.pendingJobs.slice(0, 4).map(j => (
                              <div key={j.id} className="flex justify-between">
                                <span className="text-muted-foreground truncate">{j.service_name} — {j.customer_name}</span>
                                <span className="font-medium text-foreground ml-2">+${(j.provider_payout || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={handleApprove}
                          disabled={!verificationResult.canApprove || approving}
                          className="flex items-center gap-1.5 text-xs">
                          {approving ? <Loader2 size={12} className="animate-spin" /> : <Banknote size={12} />}
                          Approve Cash Payment
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => { setSelectedJob(null); setVerificationResult(null); }}
                          className="text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
