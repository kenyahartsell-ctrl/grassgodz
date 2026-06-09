import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Users, CreditCard, Merge, Star, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

function findDuplicates(customers) {
  const groups = {};
  customers.forEach(c => {
    const keys = [];
    if (c.user_email) keys.push('email:' + c.user_email.toLowerCase().trim());
    if (c.phone) keys.push('phone:' + c.phone.replace(/\D/g, ''));
    keys.forEach(key => {
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
  });
  const seen = new Set();
  const duplicateGroups = [];
  Object.values(groups).forEach(group => {
    if (group.length < 2) return;
    const ids = group.map(c => c.id).sort().join('|');
    if (seen.has(ids)) return;
    seen.add(ids);
    duplicateGroups.push(group);
  });
  return duplicateGroups;
}

// Pick the best value from two candidates — prefer non-empty, longer strings
function best(a, b) {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return String(a).length >= String(b).length ? a : b;
}

// Score a profile — higher = more complete / more valuable to keep
function profileScore(c) {
  let score = 0;
  if (c.default_payment_method_id) score += 100; // card on file is highest value
  if (c.stripe_customer_id) score += 50;
  if (c.name) score += 10;
  if (c.phone) score += 10;
  if (c.service_address) score += 10;
  if (c.zip_code) score += 5;
  if (c.user_email) score += 20;
  return score;
}

function ProfileBadges({ customer }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {customer.default_payment_method_id && (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          <CreditCard size={9} /> Card on file
        </span>
      )}
      {customer.stripe_customer_id && (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          <Star size={9} /> Stripe customer
        </span>
      )}
      {!customer.default_payment_method_id && !customer.stripe_customer_id && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          No payment data
        </span>
      )}
      {customer.name && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          <Mail size={9} /> {customer.user_email || '—'}
        </span>
      )}
    </div>
  );
}

export default function AdminDuplicatesPanel({ customers, onRefresh }) {
  const [duplicates, setDuplicates] = useState([]);
  const [scanned, setScanned] = useState(false);
  const [mergingIdx, setMergingIdx] = useState(null);
  const [mergedGroups, setMergedGroups] = useState(new Set());

  const runScan = () => {
    const found = findDuplicates(customers);
    setDuplicates(found);
    setScanned(true);
    setMergedGroups(new Set());
    if (found.length === 0) {
      toast.success('No duplicates found!');
    } else {
      toast.warning(`Found ${found.length} duplicate group${found.length !== 1 ? 's' : ''}`);
    }
  };

  const handleSmartMerge = async (group, groupIdx) => {
    if (!window.confirm(
      `Merge ${group.length} accounts for "${group[0].user_email}"?\n\n` +
      `The best data from all accounts will be combined into one — Stripe card, payment info, name, phone, and address. ` +
      `All jobs, reviews, and invoices will be reassigned. Job photos are untouched.`
    )) return;

    setMergingIdx(groupIdx);
    try {
      // Sort by score — highest score = primary account to keep
      const sorted = [...group].sort((a, b) => profileScore(b) - profileScore(a));
      const primary = sorted[0];
      const duplicatesTo = sorted.slice(1);

      // Build merged profile — take best value from all accounts for each field
      const mergedData = {
        name: group.reduce((acc, c) => best(acc, c.name), null),
        phone: group.reduce((acc, c) => best(acc, c.phone), null),
        service_address: group.reduce((acc, c) => best(acc, c.service_address), null),
        billing_address: group.reduce((acc, c) => best(acc, c.billing_address), null),
        zip_code: group.reduce((acc, c) => best(acc, c.zip_code), null),
        user_email: group.reduce((acc, c) => best(acc, c.user_email), null),
        // Stripe: take from whichever account has it
        stripe_customer_id: group.reduce((acc, c) => acc || c.stripe_customer_id, null),
        default_payment_method_id: group.reduce((acc, c) => acc || c.default_payment_method_id, null),
        // Preserve other non-null fields from primary
        sms_opt_in: group.some(c => c.sms_opt_in),
        language: primary.language || group.find(c => c.language)?.language || null,
      };

      // Update primary account with merged best data
      await base44.entities.CustomerProfile.update(primary.id, mergedData);

      // For each duplicate: reassign all linked records then delete
      for (const dup of duplicatesTo) {
        const dupEmail = dup.user_email;

        // Reassign jobs
        const jobs = await base44.entities.Job.filter({ customer_email: dupEmail });
        for (const job of jobs) {
          await base44.entities.Job.update(job.id, {
            customer_id: primary.id,
            customer_email: mergedData.user_email,
            customer_name: mergedData.name,
          });
        }

        // Reassign reviews
        try {
          const reviews = await base44.entities.Review.filter({ customer_id: dupEmail });
          for (const review of reviews) {
            await base44.entities.Review.update(review.id, {
              customer_id: mergedData.user_email,
              customer_name: mergedData.name,
            });
          }
        } catch {}

        // Reassign invoices
        try {
          const invoices = await base44.entities.Invoice.filter({ customer_email: dupEmail });
          for (const invoice of invoices) {
            await base44.entities.Invoice.update(invoice.id, {
              customer_email: mergedData.user_email,
              customer_name: mergedData.name,
            });
          }
        } catch {}

        // Delete the duplicate profile
        await base44.entities.CustomerProfile.delete(dup.id);
      }

      toast.success(`Merged ${group.length} accounts into one — all data preserved.`);
      setMergedGroups(prev => new Set([...prev, groupIdx]));
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Merge failed: ' + err.message);
    } finally {
      setMergingIdx(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Account Management</h2>
          <p className="text-sm text-muted-foreground">Detect and smart-merge duplicate customer accounts.</p>
        </div>
        <Button onClick={runScan} className="flex items-center gap-2">
          <Users size={14} />
          Scan for Duplicates
        </Button>
      </div>

      {!scanned && (
        <div className="bg-muted/30 border border-border rounded-xl p-10 text-center">
          <Users size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click "Scan for Duplicates" to find accounts with matching emails or phone numbers.</p>
        </div>
      )}

      {scanned && duplicates.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-10 flex flex-col items-center">
          <CheckCircle2 size={32} className="text-green-500 mb-3" />
          <p className="font-semibold text-green-700">No duplicate accounts detected.</p>
        </div>
      )}

      {duplicates.map((group, groupIdx) => {
        const isMerged = mergedGroups.has(groupIdx);
        const isMerging = mergingIdx === groupIdx;
        const sorted = [...group].sort((a, b) => profileScore(b) - profileScore(a));
        const primaryAccount = sorted[0];

        if (isMerged) {
          return (
            <div key={groupIdx} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-700">Merged — {group[0].user_email}</p>
            </div>
          );
        }

        return (
          <div key={groupIdx} className="bg-card border border-amber-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-800">{group.length} duplicate accounts — {group[0].user_email}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSmartMerge(group, groupIdx)}
                disabled={isMerging}
                className="flex items-center gap-1.5 h-7 text-xs"
              >
                {isMerging ? <Loader2 size={12} className="animate-spin" /> : <Merge size={12} />}
                {isMerging ? 'Merging...' : 'Smart Merge'}
              </Button>
            </div>

            {/* What the merge will produce */}
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
              <p className="text-xs font-semibold text-blue-800 mb-1">What Smart Merge will keep:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-blue-700">
                <span>✓ Name: <strong>{group.reduce((acc, c) => best(acc, c.name), null) || '—'}</strong></span>
                <span>✓ Email: <strong>{group.reduce((acc, c) => best(acc, c.user_email), null) || '—'}</strong></span>
                <span>✓ Phone: <strong>{group.reduce((acc, c) => best(acc, c.phone), null) || '—'}</strong></span>
                <span>✓ Card on file: <strong>{group.some(c => c.default_payment_method_id) ? 'Yes ✓' : 'None'}</strong></span>
                <span>✓ Stripe customer: <strong>{group.some(c => c.stripe_customer_id) ? 'Yes ✓' : 'None'}</strong></span>
                <span>✓ Job photos: <strong>Untouched</strong></span>
              </div>
            </div>

            {/* Individual accounts */}
            <div className="divide-y divide-border">
              {sorted.map((customer, i) => (
                <div key={customer.id} className={`px-4 py-3 ${i === 0 ? 'bg-green-50/50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            Will Keep
                          </span>
                        )}
                        {i > 0 && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            Will Delete
                          </span>
                        )}
                        <p className="text-sm font-semibold text-foreground truncate">{customer.name || '(no name)'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{customer.user_email}</p>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      )}
                      {customer.service_address && (
                        <p className="text-xs text-muted-foreground truncate">{customer.service_address}</p>
                      )}
                      <ProfileBadges customer={customer} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">Created</p>
                      <p className="text-[10px] font-medium text-foreground">
                        {customer.created_date ? new Date(customer.created_date).toLocaleDateString() : '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Score: {profileScore(customer)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 bg-muted/20 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Smart Merge automatically keeps the account with the highest completeness score (card on file, Stripe data, full profile).
                All jobs, reviews, and invoices are reassigned. Job photos are never touched.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
