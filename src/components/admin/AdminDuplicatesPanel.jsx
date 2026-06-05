import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Loader2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

function findDuplicates(customers) {
  const groups = {};

  customers.forEach(c => {
    const keys = [];
    if (c.user_email) keys.push('email:' + c.user_email.toLowerCase().trim());
    if (c.phone) keys.push('phone:' + c.phone.replace(/\D/g, ''));
    if (c.name) keys.push('name:' + c.name.toLowerCase().trim());

    keys.forEach(key => {
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
  });

  // Collect sets of duplicate IDs
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

export default function AdminDuplicatesPanel({ customers, onRefresh }) {
  const [duplicates, setDuplicates] = useState([]);
  const [scanned, setScanned] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [keepSelections, setKeepSelections] = useState({});

  const runScan = () => {
    const found = findDuplicates(customers);
    setDuplicates(found);
    setScanned(true);
    if (found.length === 0) {
      toast.success('No duplicates found!');
    } else {
      toast.warning(`Found ${found.length} duplicate group(s)`);
    }
  };

  const handleDelete = async (groupIdx, deleteCustomer) => {
    const keepId = keepSelections[groupIdx];
    if (!keepId) {
      toast.error('Please select which account to keep first.');
      return;
    }
    if (keepId === deleteCustomer.id) {
      toast.error('Cannot delete the account marked as "keep".');
      return;
    }
    if (!window.confirm(`Delete ${deleteCustomer.name || deleteCustomer.user_email}? Their jobs will be reassociated to the kept account.`)) return;

    setDeletingId(deleteCustomer.id);
    try {
      // Reassign jobs linked to deleted customer
      const allJobs = await base44.entities.Job.filter({ customer_email: deleteCustomer.user_email });
      const keepCustomer = customers.find(c => c.id === keepId);
      if (keepCustomer) {
        for (const job of allJobs) {
          await base44.entities.Job.update(job.id, {
            customer_id: keepId,
            customer_email: keepCustomer.user_email,
            customer_name: keepCustomer.name,
          });
        }
      }
      // Delete the duplicate
      await base44.entities.CustomerProfile.delete(deleteCustomer.id);
      toast.success(`Deleted duplicate account: ${deleteCustomer.name || deleteCustomer.user_email}`);
      setDuplicates(prev => prev.map((g, i) => i === groupIdx ? g.filter(c => c.id !== deleteCustomer.id) : g).filter(g => g.length > 1));
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Account Management</h2>
          <p className="text-sm text-muted-foreground">Detect and merge duplicate customer accounts.</p>
        </div>
        <Button onClick={runScan} className="flex items-center gap-2">
          <Users size={14} />
          Scan for Duplicates
        </Button>
      </div>

      {!scanned && (
        <div className="bg-muted/30 border border-border rounded-xl p-10 text-center">
          <Users size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click "Scan for Duplicates" to check all customer accounts for matching names, emails, or phone numbers.</p>
        </div>
      )}

      {scanned && duplicates.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-10 flex flex-col items-center">
          <CheckCircle2 size={32} className="text-green-500 mb-3" />
          <p className="font-semibold text-green-700">No duplicate accounts detected.</p>
        </div>
      )}

      {duplicates.map((group, groupIdx) => (
        <div key={groupIdx} className="bg-card border border-amber-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-800">Duplicate Group ({group.length} accounts)</p>
          </div>
          <div className="divide-y divide-border">
            {group.map(customer => {
              const isKeep = keepSelections[groupIdx] === customer.id;
              return (
                <div key={customer.id} className={`px-4 py-3 flex items-start gap-3 ${isKeep ? 'bg-green-50' : ''}`}>
                  <input
                    type="radio"
                    name={`keep-${groupIdx}`}
                    checked={isKeep}
                    onChange={() => setKeepSelections(prev => ({ ...prev, [groupIdx]: customer.id }))}
                    className="mt-1 accent-green-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{customer.name || '(no name)'}</p>
                    <p className="text-xs text-muted-foreground">{customer.user_email}</p>
                    {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                    {customer.service_address && <p className="text-xs text-muted-foreground truncate">{customer.service_address}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">Created {new Date(customer.created_date).toLocaleDateString()}</p>
                  </div>
                  {isKeep ? (
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Keep</span>
                  ) : keepSelections[groupIdx] ? (
                    <button
                      onClick={() => handleDelete(groupIdx, customer)}
                      disabled={deletingId === customer.id}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deletingId === customer.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      Delete
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {!keepSelections[groupIdx] && (
            <div className="px-4 py-2 bg-muted/20 border-t border-border">
              <p className="text-xs text-muted-foreground">← Select the account to <strong>keep</strong>, then delete the duplicate.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}