import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  MessageSquare, Mail, UserX, CreditCard, Send, Check, ChevronRight,
  Loader2, Phone, Users, User, AlertTriangle, CheckSquare, Square
} from 'lucide-react';

// ─── Shared helpers ───────────────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return v; }
}

async function sendEmail(to, subject, body) {
  await base44.integrations.Core.SendEmail({ to, subject, body });
}

const SIGNUP_URL = 'https://grassgodz.com/signup/provider';
const PAYMENT_SETUP_URL = 'https://grassgodz.com/customer/profile';

// ─── SUB-TAB: DIRECT CHAT ────────────────────────────────────────────────────
function DirectChatPanel({ customers, providers }) {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null); // { id, name, email, type }
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setAdminUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    base44.entities.Message.filter({ job_id: `direct:${selected.email}` })
      .then(setMessages).catch(() => setMessages([]));
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const unreadCount = (person) => {
    // Count unread messages from this person (sender_id matches their email, no read_at)
    return messages.filter(m => m.sender_id === person.email && !m.read_at).length;
  };

  const handleSend = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    try {
      const msg = await base44.entities.Message.create({
        job_id: `direct:${selected.email}`,
        sender_id: adminUser?.email || 'admin',
        sender_role: 'provider', // using 'provider' as admin role proxy
        body: input.trim(),
      });
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const customerList = customers.map(c => ({ id: c.id, name: c.name || c.user_email, email: c.user_email, type: 'customer' }));
  const providerList = providers.map(p => ({ id: p.id, name: p.name || p.business_name || p.user_email, email: p.user_email, type: 'provider' }));

  const SidebarPerson = ({ person }) => {
    const unread = 0; // simplified — real unread would need per-thread filtering
    const isSelected = selected?.id === person.id;
    return (
      <button
        onClick={() => setSelected(person)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors ${isSelected ? (person.type === 'customer' ? 'bg-emerald-100 text-emerald-900' : 'bg-blue-100 text-blue-900') : 'hover:bg-gray-100'}`}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${person.type === 'customer' ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-200 text-blue-800'}`}>
          {(person.name || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{person.name}</p>
          <p className="text-[10px] text-gray-400 truncate">{person.email}</p>
        </div>
        {unread > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">{unread}</span>}
      </button>
    );
  };

  const threadMessages = selected
    ? messages.filter(m => m.job_id === `direct:${selected.email}`)
    : [];

  return (
    <div className="flex gap-0 border border-gray-200 rounded-2xl overflow-hidden h-[540px]">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
        <div className="p-2 border-b border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-1 py-1">Customers</p>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {customerList.length === 0 && <p className="text-xs text-gray-400 px-1">None</p>}
            {customerList.map(p => <SidebarPerson key={p.id} person={p} />)}
          </div>
        </div>
        <div className="p-2 flex-1 overflow-hidden flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 px-1 py-1">Providers</p>
          <div className="space-y-0.5 overflow-y-auto flex-1">
            {providerList.length === 0 && <p className="text-xs text-gray-400 px-1">None</p>}
            {providerList.map(p => <SidebarPerson key={p.id} person={p} />)}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Select a customer or provider to start a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`px-4 py-3 border-b border-gray-200 flex items-center gap-2 ${selected.type === 'customer' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selected.type === 'customer' ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-200 text-blue-800'}`}>
                {(selected.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-500">{selected.email}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {threadMessages.length === 0 && <p className="text-xs text-gray-400 text-center py-10">No messages yet. Send a message below.</p>}
              {threadMessages.map(m => {
                const isAdmin = m.sender_id === adminUser?.email || m.sender_id === 'admin';
                return (
                  <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${isAdmin ? 'bg-gray-800 text-white' : (selected.type === 'customer' ? 'bg-emerald-100 text-emerald-900' : 'bg-blue-100 text-blue-900')}`}>
                      {m.body}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button onClick={handleSend} disabled={sending || !input.trim()} className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-black disabled:opacity-40 transition-colors">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SUB-TAB: EMAIL BLAST ────────────────────────────────────────────────────
function EmailBlastPanel({ customers, providers }) {
  const [blastTab, setBlastTab] = useState('customers');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);

  const list = blastTab === 'customers'
    ? customers.map(c => ({ id: c.id, name: c.name || '—', email: c.user_email }))
    : providers.map(p => ({ id: p.id, name: p.name || p.business_name || '—', email: p.user_email }));

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(selected.size === list.length ? new Set() : new Set(list.map(p => p.id)));

  const fillCashInvite = () => {
    setSubject("You're Invited to Join GrassGodz — Get Paid!");
    setBody(`Hi there,

We'd love to have you on the GrassGodz team! We connect lawn care professionals with customers in your area who need reliable, quality service.

Here's why pros love GrassGodz:
• Get paid same-day for completed jobs
• No bidding wars — just claim and go
• Flexible schedule, you pick your jobs
• Cash and card payment options

Ready to start earning? Sign up today:
${SIGNUP_URL}

Questions? Just reply to this email.

— The GrassGodz Team`);
  };

  const handleSend = async () => {
    const targets = list.filter(p => selected.has(p.id) && p.email);
    if (!targets.length) { toast.error('Select at least one recipient'); return; }
    if (!subject.trim() || !body.trim()) { toast.error('Subject and message are required'); return; }
    setSending(true);
    let sent = 0, failed = 0;
    for (const t of targets) {
      try {
        await sendEmail(t.email, subject, `Hi ${t.name},\n\n${body}`);
        sent++;
      } catch { failed++; }
    }
    setSending(false);
    if (sent) toast.success(`Sent to ${sent} recipient${sent > 1 ? 's' : ''}${failed ? ` (${failed} failed)` : ''}`);
    else toast.error('All sends failed — check email config');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => { setBlastTab('customers'); setSelected(new Set()); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${blastTab === 'customers' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Customers
        </button>
        <button onClick={() => { setBlastTab('providers'); setSelected(new Set()); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${blastTab === 'providers' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Providers
        </button>
        {blastTab === 'providers' && (
          <button onClick={fillCashInvite} className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors">
            💵 Cash Invite Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipient list */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-200">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
              {selected.size === list.length && list.length > 0 ? <CheckSquare size={14} className={blastTab === 'customers' ? 'text-emerald-600' : 'text-blue-600'} /> : <Square size={14} />}
              Select All ({list.length})
            </button>
            {selected.size > 0 && <span className="ml-auto text-xs text-gray-400">{selected.size} selected</span>}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {list.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No {blastTab} found.</p>}
            {list.map(p => (
              <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                  className="rounded border-gray-300 accent-emerald-600" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.email || 'No email'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Compose */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Subject *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Message *</label>
            <textarea rows={7} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." />
          </div>
          <button onClick={handleSend} disabled={sending || selected.size === 0}
            className="w-full py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold hover:bg-black disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {sending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Email Blast ({selected.size})</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SUB-TAB: PENDING PROVIDERS ──────────────────────────────────────────────
function PendingProvidersPanel({ providers }) {
  const [sending, setSending] = useState(new Set());
  const [sendingAll, setSendingAll] = useState(false);

  const pending = providers.filter(p =>
    !p.onboarding_complete || ['pending_review', 'more_info_needed', 'background_check_pending'].includes(p.status)
  );

  const getStatus = (p) => {
    if (!p.onboarding_complete && !p.name && !p.phone) return 'Never logged in';
    if (!p.onboarding_complete) return 'Incomplete profile';
    return 'Pending review';
  };

  const sendReminder = async (p) => {
    setSending(prev => new Set(prev).add(p.id));
    try {
      await sendEmail(
        p.user_email,
        'Complete Your GrassGodz Provider Profile',
        `Hi ${p.name || 'there'},\n\nYou're almost there! Please complete your GrassGodz provider profile so we can activate your account and start sending you jobs.\n\nComplete your profile here:\n${SIGNUP_URL}\n\nIf you have questions, just reply to this email.\n\n— The GrassGodz Team`
      );
      toast.success(`Reminder sent to ${p.name || p.user_email}`);
    } catch {
      toast.error(`Failed to send to ${p.user_email}`);
    } finally {
      setSending(prev => { const n = new Set(prev); n.delete(p.id); return n; });
    }
  };

  const sendAllReminders = async () => {
    setSendingAll(true);
    let sent = 0, failed = 0;
    for (const p of pending) {
      try { await sendReminder(p); sent++; } catch { failed++; }
    }
    setSendingAll(false);
    toast.success(`Sent ${sent} reminder${sent !== 1 ? 's' : ''}${failed ? ` (${failed} failed)` : ''}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-amber-800">{pending.length} providers with incomplete setup</p>
          <p className="text-xs text-gray-500">These providers haven't finished signing up or are pending review.</p>
        </div>
        <button onClick={sendAllReminders} disabled={sendingAll || pending.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors flex items-center gap-2">
          {sendingAll ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Send All Reminders
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-amber-200 rounded-xl bg-amber-50">
          <Check size={28} className="text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-amber-700 font-medium">All providers have completed signup!</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-amber-800">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-amber-800 hidden sm:table-cell">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-amber-800 hidden md:table-cell">Phone</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-amber-800">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-amber-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-900">{p.name || p.business_name || '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-xs text-gray-500">{p.user_email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-500">{p.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                      {getStatus(p)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => sendReminder(p)} disabled={sending.has(p.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1">
                        {sending.has(p.id) ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Remind
                      </button>
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1">
                          <Phone size={10} /> Call
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SUB-TAB: CUSTOMERS WITHOUT CARD ────────────────────────────────────────
function CustomersWithoutCardPanel({ customers, jobs }) {
  const [sending, setSending] = useState(new Set());
  const [sendingAll, setSendingAll] = useState(false);

  const noCard = customers.filter(c => !c.stripe_customer_id && !c.default_payment_method_id);

  const jobCount = (c) => jobs.filter(j => j.customer_email === c.user_email).length;
  const lastJobDate = (c) => {
    const cjobs = jobs.filter(j => j.customer_email === c.user_email).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return cjobs[0]?.scheduled_date || cjobs[0]?.created_date || null;
  };

  const sendSetupEmail = async (c) => {
    setSending(prev => new Set(prev).add(c.id));
    try {
      await sendEmail(
        c.user_email,
        'Set Up Your Payment Method — GrassGodz',
        `Hi ${c.name || 'there'},\n\nTo book your next service with GrassGodz, please add a payment method to your account.\n\nIt only takes a minute:\n${PAYMENT_SETUP_URL}\n\nYour card is stored securely and only charged after your job is complete.\n\n— The GrassGodz Team`
      );
      toast.success(`Payment setup email sent to ${c.name || c.user_email}`);
    } catch {
      toast.error(`Failed to send to ${c.user_email}`);
    } finally {
      setSending(prev => { const n = new Set(prev); n.delete(c.id); return n; });
    }
  };

  const sendToAll = async () => {
    setSendingAll(true);
    let sent = 0, failed = 0;
    for (const c of noCard) {
      try { await sendSetupEmail(c); sent++; } catch { failed++; }
    }
    setSendingAll(false);
    toast.success(`Sent ${sent} email${sent !== 1 ? 's' : ''}${failed ? ` (${failed} failed)` : ''}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">{noCard.length} customers without a payment method</p>
          <p className="text-xs text-gray-500">These customers have no Stripe card on file.</p>
        </div>
        <button onClick={sendToAll} disabled={sendingAll || noCard.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center gap-2">
          {sendingAll ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Send to All
        </button>
      </div>

      {noCard.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-emerald-200 rounded-xl bg-emerald-50">
          <Check size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-emerald-700 font-medium">All customers have a payment method on file!</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 hidden sm:table-cell">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 hidden md:table-cell">Phone</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600">Jobs</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 hidden sm:table-cell">Last Job</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {noCard.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-900">{c.name || '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-xs text-gray-500">{c.user_email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-500">{c.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-700">{jobCount(c)}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-xs text-gray-400">{fmtDate(lastJobDate(c))}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => sendSetupEmail(c)} disabled={sending.has(c.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center gap-1 whitespace-nowrap">
                      {sending.has(c.id) ? <Loader2 size={10} className="animate-spin" /> : <CreditCard size={10} />} Send Setup
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const SUB_TABS = [
  { key: 'chat', label: 'Direct Chat', icon: MessageSquare },
  { key: 'blast', label: 'Email Blast', icon: Mail },
  { key: 'pending', label: 'Pending Providers', icon: AlertTriangle },
  { key: 'nocard', label: 'No Card', icon: CreditCard },
];

export default function AdminCommunicationsTab({ customers, providers, jobs }) {
  const [subTab, setSubTab] = useState('chat');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Communications</h2>
        <p className="text-sm text-gray-500">Manage direct messages, email blasts, and outreach.</p>
      </div>

      {/* Sub-tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              subTab === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'chat' && <DirectChatPanel customers={customers} providers={providers} />}
      {subTab === 'blast' && <EmailBlastPanel customers={customers} providers={providers} />}
      {subTab === 'pending' && <PendingProvidersPanel providers={providers} />}
      {subTab === 'nocard' && <CustomersWithoutCardPanel customers={customers} jobs={jobs} />}
    </div>
  );
}