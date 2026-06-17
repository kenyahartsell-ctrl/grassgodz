import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  AlertTriangle, X, ChevronDown, ChevronUp, UserCircle, Briefcase,
  DollarSign, Star, MessageSquare, Plus, CreditCard, CheckCircle2,
  Clock, Loader2, Mail, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function fmtAmt(val) {
  if (val == null) return '—';
  return `$${Number(val).toFixed(2)}`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Alert Strip ─────────────────────────────────────────────────────────────
function AlertStrip({ customers, providers, jobs, onViewCustomers, onViewProviders }) {
  const [dismissed, setDismissed] = useState({});

  const noCard = customers.filter(c => !c.stripe_customer_id && !c.default_payment_method_id);
  const pendingProviders = providers.filter(p =>
    ['pending_review', 'pending_approval', 'more_info_needed', 'background_check_pending'].includes(p.status)
  );

  const alerts = [
    noCard.length > 0 && {
      id: 'no-card',
      color: 'amber',
      message: `${noCard.length} customer${noCard.length > 1 ? 's' : ''} without a card on file`,
      action: 'View Customers',
      onAction: onViewCustomers,
    },
    pendingProviders.length > 0 && {
      id: 'pending-providers',
      color: 'red',
      message: `${pendingProviders.length} provider${pendingProviders.length > 1 ? 's' : ''} pending approval or needing attention`,
      action: 'View Providers',
      onAction: onViewProviders,
    },
  ].filter(Boolean).filter(a => !dismissed[a.id]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            alert.color === 'red'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="flex-1">{alert.message}</span>
          <button
            onClick={alert.onAction}
            className={`text-xs font-semibold underline hover:no-underline flex-shrink-0 ${
              alert.color === 'red' ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            {alert.action}
          </button>
          <button onClick={() => setDismissed(d => ({ ...d, [alert.id]: true }))} className="p-0.5 rounded hover:opacity-70 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({ provider, jobs, onAssign, onMessage }) {
  const todayStr = getTodayStr();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const myJobs = jobs.filter(j =>
    j.provider_email === provider.user_email || j.provider_id === provider.id
  );

  const todayJobs = myJobs.filter(j => j.scheduled_date === todayStr);
  const todayScheduled = todayJobs.filter(j => ['scheduled', 'accepted'].includes(j.status)).length;
  const todayCompleted = todayJobs.filter(j => j.status === 'completed').length;
  const todayPending = todayJobs.filter(j => j.status === 'in_progress').length;

  const weekCompleted = myJobs.filter(j => {
    if (j.status !== 'completed' || !j.completed_at) return false;
    const d = new Date(j.completed_at);
    return d >= weekStart && d <= weekEnd;
  });
  const weekPay = weekCompleted.reduce((sum, j) => sum + (j.provider_payout || (j.quoted_price ? j.quoted_price * 0.9 : 0)), 0);

  const needsAttention = ['more_info_needed', 'pending_review', 'background_check_pending', 'background_check_failed', 'suspended'].includes(provider.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          {provider.profile_image_url ? (
            <img src={provider.profile_image_url} alt={provider.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-emerald-700">{initials(provider.name || provider.business_name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{provider.name || provider.business_name || provider.user_email}</p>
          <p className="text-xs text-gray-500 truncate">{provider.user_email}</p>
        </div>
        {needsAttention && (
          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0">
            <AlertTriangle size={9} /> Needs Attention
          </span>
        )}
        {provider.avg_rating > 0 && (
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0">
            <Star size={9} /> {provider.avg_rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Today</p>
          <p className="text-xs font-semibold text-gray-700">
            {todayScheduled > 0 && <span className="text-blue-600">{todayScheduled} sched </span>}
            {todayCompleted > 0 && <span className="text-green-600">{todayCompleted} done </span>}
            {todayPending > 0 && <span className="text-amber-600">{todayPending} active</span>}
            {todayScheduled === 0 && todayCompleted === 0 && todayPending === 0 && <span className="text-gray-400">No jobs</span>}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Pay Due</p>
          <p className="text-xs font-bold text-emerald-700">{weekPay > 0 ? fmtAmt(weekPay) : '—'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onAssign(provider)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
        >
          <Briefcase size={11} /> Assign Job
        </button>
        <button
          onClick={() => onMessage(provider)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <MessageSquare size={11} /> Message
        </button>
      </div>
    </div>
  );
}

// ─── Job Pool Section ─────────────────────────────────────────────────────────
function JobPoolSection({ title, color, jobs, providers, onAssign }) {
  const colorMap = {
    green: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-300 bg-amber-50 text-amber-800',
    gray: 'border-gray-300 bg-gray-50 text-gray-700',
  };
  const dotMap = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    gray: 'bg-gray-400',
  };

  const [collapsed, setCollapsed] = useState(color === 'gray');

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`w-full flex items-center gap-3 px-4 py-3 border-b ${colorMap[color]} transition-colors`}
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotMap[color]}`} />
        <span className="font-bold text-sm flex-1 text-left">{title}</span>
        <span className="text-sm font-medium opacity-70">({jobs.length})</span>
        {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
      </button>

      {!collapsed && (
        <div className="divide-y divide-gray-100">
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No jobs in this pool.</p>
          ) : (
            jobs.map(j => (
              <div key={j.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{j.customer_name || '—'}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize flex-shrink-0">
                      {j.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {j.service_name || '—'} · {j.scheduled_date || 'No date'} {j.scheduled_time ? `@ ${j.scheduled_time}` : ''} · {j.address || '—'}
                  </p>
                  {j.provider_name && (
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">Provider: {j.provider_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-800">{fmtAmt(j.quoted_price || j.final_price)}</span>
                  {color === 'green' && (
                    <button
                      onClick={() => onAssign(j)}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap"
                    >
                      Assign →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Customers Without Card ───────────────────────────────────────────────────
function CustomersNoCardTable({ customers, jobs }) {
  const [sending, setSending] = useState(null);

  const noCard = customers.filter(c => !c.stripe_customer_id && !c.default_payment_method_id);
  if (noCard.length === 0) return null;

  const lastJobDate = (email) => {
    const cJobs = jobs.filter(j => j.customer_email === email);
    if (cJobs.length === 0) return null;
    const sorted = cJobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return sorted[0].scheduled_date || sorted[0].created_date;
  };

  const sendPaymentSetup = async (customer) => {
    setSending(customer.id);
    try {
      await base44.functions.invoke('adminSendEmail', {
        to: customer.user_email,
        subject: 'Add a payment method to your GrassGodz account',
        body: `Hi ${customer.name || 'there'},\n\nWe noticed your GrassGodz account doesn't have a payment method on file. Please log in to your customer portal and add a card to continue booking services.\n\nThank you!\nThe GrassGodz Team`,
      });
      toast.success(`Payment setup email sent to ${customer.user_email}`);
    } catch (err) {
      toast.error('Failed to send email');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <CreditCard size={15} className="text-gray-500" />
        <h3 className="text-sm font-bold text-gray-800">Customers Without Card on File</h3>
        <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{noCard.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="text-left px-4 py-2 font-semibold">Customer</th>
              <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Last Job</th>
              <th className="text-center px-4 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {noCard.map((c, i) => {
              const last = lastJobDate(c.user_email);
              return (
                <tr key={c.id} className={`${i < noCard.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{c.name || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{c.user_email}</td>
                  <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{c.phone || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{last ? (typeof last === 'string' ? last.split('T')[0] : format(new Date(last), 'MMM d, yyyy')) : '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => sendPaymentSetup(c)}
                      disabled={sending === c.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
                    >
                      {sending === c.id ? <Loader2 size={9} className="animate-spin" /> : <Mail size={9} />}
                      Send Payment Setup
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Dashboard Panel ─────────────────────────────────────────────────────
export default function AdminDashboardPanel({ jobs, customers, providers, quotes, payments, onNavigate, onAssignJob }) {
  const todayStr = getTodayStr();

  // Job pools
  const availableJobs = jobs.filter(j => ['requested', 'pending_payment', 'pending_deposit'].includes(j.status) && !j.provider_id && !j.provider_email);
  const activeJobs = jobs.filter(j => ['accepted', 'scheduled', 'in_progress', 'quoted'].includes(j.status));
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const completedThisWeek = jobs.filter(j => {
    if (j.status !== 'completed' || !j.completed_at) return false;
    const d = new Date(j.completed_at);
    return d >= weekStart && d <= weekEnd;
  });

  const activeProviders = providers.filter(p => p.status === 'active');

  return (
    <div className="space-y-6">

      {/* 1. Alert Strip */}
      <AlertStrip
        customers={customers}
        providers={providers}
        jobs={jobs}
        onViewCustomers={() => onNavigate('customers')}
        onViewProviders={() => onNavigate('providers')}
      />

      {/* 2. Provider Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Provider Overview</h2>
          <span className="text-xs text-gray-500">{activeProviders.length} active provider{activeProviders.length !== 1 ? 's' : ''}</span>
        </div>
        {activeProviders.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-10 text-center">
            <p className="text-sm text-gray-400">No active providers yet.</p>
            <button onClick={() => onNavigate('providers')} className="mt-2 text-xs text-emerald-700 font-semibold underline">Go to Providers →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeProviders.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                jobs={jobs}
                onAssign={() => onAssignJob(null, p)}
                onMessage={() => onNavigate('support')}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Job Pools */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Job Pools</h2>
        <JobPoolSection
          title="Available Jobs — Open Pool"
          color="green"
          jobs={availableJobs}
          providers={providers}
          onAssign={(job) => onAssignJob(job)}
        />
        <JobPoolSection
          title="Active / In Progress"
          color="amber"
          jobs={activeJobs}
          providers={providers}
          onAssign={(job) => onAssignJob(job)}
        />
        <JobPoolSection
          title={`Completed This Week (${completedThisWeek.length})`}
          color="gray"
          jobs={completedThisWeek}
          providers={providers}
          onAssign={() => {}}
        />
      </div>

      {/* 4. Customers Without Card */}
      <CustomersNoCardTable customers={customers} jobs={jobs} />

    </div>
  );
}