import { useState, useMemo } from 'react';
import { X, Search, CheckCircle, AlertTriangle, ArrowRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function AdminMergeCustomersModal({ customers, onClose, onMerged }) {
  const [searchTerm, setSearchTerm] = useState('Kwasi'); // pre-fill for convenience
  const [primaryId, setPrimaryId] = useState(null);
  const [duplicateIds, setDuplicateIds] = useState([]);
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState(null);

  const matchedCustomers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lower = searchTerm.toLowerCase();
    return customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(lower)) ||
      (c.user_email && c.user_email.toLowerCase().includes(lower)) ||
      (c.service_address && c.service_address.toLowerCase().includes(lower)) ||
      (c.phone && c.phone.includes(lower))
    );
  }, [customers, searchTerm]);

  const handleToggleDuplicate = (id) => {
    if (primaryId === id) return;
    setDuplicateIds(prev => 
      prev.includes(id) ? prev.filter(dupId => dupId !== id) : [...prev, id]
    );
  };

  const handleSetPrimary = (id) => {
    setPrimaryId(id);
    setDuplicateIds(prev => prev.filter(dupId => dupId !== id));
  };

  const handleMerge = async () => {
    if (!primaryId) return toast.error("Please select a primary account.");
    if (duplicateIds.length === 0) return toast.error("Please select at least one duplicate account to merge.");

    const primary = customers.find(c => c.id === primaryId);
    if (!confirm(`Are you sure you want to merge ${duplicateIds.length} account(s) into "${primary.name} (${primary.user_email})"? The duplicate accounts will be deleted.`)) return;

    setMerging(true);
    try {
      const res = await base44.functions.invoke('mergeCustomers', {
        primary_id: primaryId,
        duplicate_ids: duplicateIds
      });

      if (res.data?.success) {
        setResult(res.data.results);
        toast.success("Accounts successfully merged!");
      } else {
        toast.error(res.data?.error || "Merge failed.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to execute merge.");
    } finally {
      setMerging(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Merge Complete</h2>
          <p className="text-muted-foreground mb-6">The duplicate accounts have been merged successfully.</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-left">
            <div className="bg-muted p-3 rounded-lg"><span className="font-bold">{result.duplicates_deleted}</span> Accounts Deleted</div>
            <div className="bg-muted p-3 rounded-lg"><span className="font-bold">{result.jobs_updated}</span> Jobs Re-assigned</div>
            <div className="bg-muted p-3 rounded-lg"><span className="font-bold">{result.invoices_updated}</span> Invoices Updated</div>
            <div className="bg-muted p-3 rounded-lg"><span className="font-bold">{result.payments_updated}</span> Payments Updated</div>
            <div className="bg-muted p-3 rounded-lg"><span className="font-bold">{result.messages_updated}</span> Messages Updated</div>
            <div className="bg-muted p-3 rounded-lg"><span className="font-bold">{result.reviews_updated}</span> Reviews Updated</div>
          </div>

          <Button className="w-full" onClick={() => { onClose(); onMerged(); }}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Users size={20}/> Merge Duplicate Customers</h2>
            <p className="text-xs text-muted-foreground">Find duplicates and merge their jobs, payments, and history into one primary account.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text"
              placeholder="Search by name, email, or address (e.g., Kwasi, 110hurdles@gmail.com)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          {matchedCustomers.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold mb-2">{matchedCustomers.length} Matches Found</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedCustomers.map(c => {
                  const isPrimary = primaryId === c.id;
                  const isDuplicate = duplicateIds.includes(c.id);
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`border rounded-xl p-4 transition-colors ${isPrimary ? 'border-primary bg-primary/5 ring-1 ring-primary' : isDuplicate ? 'border-amber-400 bg-amber-50' : 'border-border bg-card'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-foreground text-sm">{c.name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground">{c.user_email}</p>
                        </div>
                        {isPrimary && <span className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Primary</span>}
                        {isDuplicate && <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Merge target</span>}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-3 space-y-1">
                        <p>Address: <span className="text-foreground">{c.service_address || '—'}</span></p>
                        <p>Phone: <span className="text-foreground">{c.phone || '—'}</span></p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant={isPrimary ? "default" : "outline"} 
                          size="sm" 
                          className="flex-1 text-xs h-8"
                          onClick={() => handleSetPrimary(c.id)}
                        >
                          {isPrimary ? 'Selected Primary' : 'Set as Primary'}
                        </Button>
                        <Button 
                          variant={isDuplicate ? "secondary" : "outline"} 
                          size="sm" 
                          className={`flex-1 text-xs h-8 ${isDuplicate ? 'bg-amber-200 hover:bg-amber-300 text-amber-900' : ''}`}
                          onClick={() => handleToggleDuplicate(c.id)}
                          disabled={isPrimary}
                        >
                          {isDuplicate ? 'Will be merged' : 'Mark to Merge'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
               <AlertTriangle size={32} className="mx-auto mb-3 text-muted-foreground/50" />
               <p>No customers found matching "{searchTerm}"</p>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="text-sm">
            <p><span className="font-semibold text-foreground">Primary:</span> {primaryId ? customers.find(c=>c.id===primaryId)?.user_email : 'None selected'}</p>
            <p><span className="font-semibold text-foreground">To merge:</span> {duplicateIds.length} account(s)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={merging}>Cancel</Button>
            <Button onClick={handleMerge} disabled={merging || !primaryId || duplicateIds.length === 0} className="gap-2">
              {merging ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Execute Merge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}