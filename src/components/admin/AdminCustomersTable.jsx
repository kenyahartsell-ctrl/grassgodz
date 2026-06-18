import { useState } from 'react';
import { ChevronDown, Eye, Mail, Trash2, Pencil, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import CustomerDetailModal from './CustomerDetailModal';
import AdminEditCustomerModal from './AdminEditCustomerModal';
import AdminMergeCustomersModal from './AdminMergeCustomersModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function EmailComposeModal({ customer, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Please fill in subject and message.'); return; }
    setSending(true);
    try {
      const res = await base44.functions.invoke('adminSendEmail', {
        to: customer.user_email,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (res.data?.success) {
        toast.success(`Email sent to ${customer.user_email}`);
        onClose();
      } else {
        toast.error(res.data?.error || 'Failed to send email');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Email Customer</h3>
            <p className="text-xs text-muted-foreground">{customer.user_email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleSend} disabled={sending} className="flex-1 gap-1">
              {sending ? <><Loader2 size={13} className="animate-spin" /> Sending...</> : <><Send size={13} /> Send Email</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomersTable({ customers, jobs, quotes, onCustomerDeleted }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [emailingCustomer, setEmailingCustomer] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [customerList, setCustomerList] = useState(customers);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (customerId, customerName) => {
    if (!confirm(`Delete customer profile for ${customerName}? This cannot be undone.`)) return;
    
    setDeletingId(customerId);
    try {
      await base44.functions.invoke('deleteCustomer', { customer_id: customerId });
      toast.success(`${customerName} deleted`);
      onCustomerDeleted?.();
    } catch (err) {
      toast.error('Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          jobs={jobs.filter(j => j.customer_email === selectedCustomer.user_email)}
          quotes={quotes}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      {emailingCustomer && (
        <EmailComposeModal customer={emailingCustomer} onClose={() => setEmailingCustomer(null)} />
      )}
      {editingCustomer && (
        <AdminEditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={(updated) => {
            setCustomerList(prev => prev.map(c => c.id === updated.id ? updated : c));
            setEditingCustomer(null);
          }}
        />
      )}
      {showMergeModal && (
        <AdminMergeCustomersModal
          customers={customerList}
          onClose={() => setShowMergeModal(false)}
          onMerged={async () => {
            setShowMergeModal(false);
            onCustomerDeleted?.(); // re-fetch data
          }}
        />
      )}
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowMergeModal(true)} className="gap-2">
          Merge Duplicate Accounts
        </Button>
      </div>
      <div className="space-y-2">
        {customerList.map(c => {
          const customerJobs = jobs.filter(j => j.customer_email === c.user_email);
          const open = expandedId === c.id;
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(open ? null : c.id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{(c.name || c.user_email)[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{c.user_email}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">{customerJobs.length} job{customerJobs.length !== 1 ? 's' : ''}</span>
                  {c.zip_code && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground hidden sm:block">{c.zip_code}</span>}
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {open && (
                <div className="border-t border-border px-4 py-4 bg-muted/10">
                  {/* Contact info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium ml-1">{c.phone || '—'}</span></div>
                    <div><span className="text-muted-foreground">ZIP:</span> <span className="font-medium ml-1">{c.zip_code || '—'}</span></div>
                    <div><span className="text-muted-foreground">Address:</span> <span className="font-medium ml-1">{c.service_address || '—'}</span></div>
                  </div>

                  {/* Jobs list */}
                  {customerJobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No jobs yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground mb-1">Jobs</p>
                      {customerJobs.map(j => {
                        const jobQuotes = quotes.filter(q => q.job_id === j.id);
                        return (
                          <div key={j.id} className="bg-background border border-border rounded-lg px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">{j.service_name}</p>
                              <StatusBadge status={j.status} />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              <span>{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : 'No date'}</span>
                              <span>{j.address}</span>
                              {j.quoted_price && <span className="font-semibold text-foreground">${j.quoted_price}</span>}
                              <span>Provider: {j.provider_name || 'Unassigned'}</span>
                            </div>
                            {jobQuotes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">{jobQuotes.length} Quote{jobQuotes.length !== 1 ? 's' : ''}</p>
                                <div className="space-y-1">
                                  {jobQuotes.map(q => (
                                    <div key={q.id} className="flex items-center justify-between text-xs">
                                      <span className="text-foreground">{q.provider_name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-primary">${q.price}</span>
                                        <StatusBadge status={q.status} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setSelectedCustomer(c)}>
                      <Eye size={12} /> Full Profile
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditingCustomer(c)}>
                      <Pencil size={12} /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEmailingCustomer(c)}>
                      <Mail size={12} /> Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(c.id, c.name || c.user_email)}
                      disabled={deletingId === c.id}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}