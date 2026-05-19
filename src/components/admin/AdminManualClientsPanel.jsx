import { useState, useEffect } from 'react';
import { Plus, Pencil, Play, Pause, StopCircle, X, DollarSign, History, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–7pm)', 'Any time'];
const SERVICES = ['Lawn Mowing', 'Leaf Blowing', 'Edging', 'Weed Pulling', 'Mulching', 'Snow Removal', 'Other'];

const EMPTY_FORM = {
  client_name: '',
  address: '',
  zip_code: '',
  service_type: 'Lawn Mowing',
  notes: '',
  preferred_day: 'Monday',
  preferred_time: 'Morning (8am–12pm)',
  next_job_date: new Date().toISOString().split('T')[0],
  status: 'active',
};

function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-bold text-foreground">{initial?.id ? 'Edit Client' : 'Add Manual Client'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name *</label>
          <input required value={form.client_name} onChange={e => set('client_name', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Service Type *</label>
          <select value={form.service_type} onChange={e => set('service_type', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            {SERVICES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Service Address *</label>
          <input required value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="123 Main St, City, State"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">ZIP Code *</label>
          <input required value={form.zip_code} onChange={e => set('zip_code', e.target.value.replace(/\D/g,'').slice(0,5))}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">First Job Date *</label>
          <input type="date" required value={form.next_job_date} onChange={e => set('next_job_date', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Preferred Day</label>
          <select value={form.preferred_day} onChange={e => set('preferred_day', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Preferred Time</label>
          <select value={form.preferred_time} onChange={e => set('preferred_time', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Notes / Special Instructions</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} placeholder="Gate code, dog in yard, tall grass, etc."
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Client'}</Button>
      </div>
    </form>
  );
}

function ClientCard({ client, allJobs, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const clientJobs = allJobs.filter(j => j.recurrence_parent_id === client.id);
  const completedJobs = clientJobs.filter(j => j.status === 'completed');

  const statusConfig = {
    active: { label: 'Active', cls: 'bg-green-100 text-green-800' },
    paused: { label: 'Paused', cls: 'bg-amber-100 text-amber-800' },
    stopped: { label: 'Stopped', cls: 'bg-red-100 text-red-800' },
  };
  const cfg = statusConfig[client.status] || statusConfig.active;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'stopped' && !window.confirm(`Permanently stop recurring jobs for ${client.client_name}? This cannot be undone.`)) return;
    await base44.entities.ManualClient.update(client.id, { status: newStatus });
    onUpdate({ ...client, status: newStatus });
    toast.success(`${client.client_name} ${newStatus === 'active' ? 'resumed' : newStatus === 'paused' ? 'paused' : 'stopped'}.`);
  };

  if (editing) {
    return (
      <ClientForm
        initial={client}
        onSave={async (data) => {
          await base44.entities.ManualClient.update(client.id, data);
          onUpdate({ ...client, ...data });
          setEditing(false);
          toast.success('Client updated.');
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{client.client_name}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <DollarSign size={10} /> Cash
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{client.address} · {client.zip_code}</p>
          <p className="text-xs text-muted-foreground">{client.service_type} · Every 2 weeks · {client.preferred_day} {client.preferred_time}</p>
          {client.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{client.notes}"</p>}
          {client.next_job_date && client.status === 'active' && (
            <p className="text-xs text-primary font-medium mt-1">Next job: {new Date(client.next_job_date).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
            <Pencil size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        {client.status === 'paused' && (
          <button onClick={() => handleStatusChange('active')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <Play size={11} /> Resume
          </button>
        )}
        {client.status === 'active' && (
          <button onClick={() => handleStatusChange('paused')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
            <Pause size={11} /> Pause
          </button>
        )}
        {client.status !== 'stopped' && (
          <button onClick={() => handleStatusChange('stopped')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
            <StopCircle size={11} /> Stop
          </button>
        )}
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors ml-auto">
          <History size={11} /> History ({completedJobs.length})
          {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Job history */}
      {showHistory && (
        <div className="mt-3 border-t border-border pt-3 space-y-2">
          {clientJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No jobs created yet.</p>
          ) : (
            clientJobs.sort((a,b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)).map(j => (
              <div key={j.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  j.status === 'completed' ? 'bg-green-100 text-green-700' :
                  j.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{j.status}</span>
                <span className="text-muted-foreground">{j.provider_name || 'Unassigned'}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminManualClientsPanel({ allJobs }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.entities.ManualClient.list('-created_date').then(data => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (data) => {
    const created = await base44.entities.ManualClient.create(data);
    setClients(prev => [created, ...prev]);
    setShowForm(false);

    // Immediately create the first job so it appears in Available Jobs right away
    try {
      // Create a CustomerProfile for this manual client so jobs work correctly
      const profile = await base44.entities.CustomerProfile.create({
        user_email: `manual_${created.id}@grassgodz.internal`,
        name: created.client_name,
        service_address: created.address,
        zip_code: created.zip_code,
        billing_address: created.address,
      });

      await base44.entities.Job.create({
        customer_id: profile.id,
        customer_name: created.client_name,
        customer_email: null,
        service_id: 'manual',
        service_name: created.service_type,
        address: created.address,
        zip_code: created.zip_code,
        scheduled_date: created.next_job_date,
        customer_notes: created.notes || '',
        recurrence: 'biweekly',
        recurrence_parent_id: created.id,
        status: 'requested',
        is_cash_job: true,
        payment_method: 'cash',
        quoted_price: 0,
      });

      // Advance next_job_date by 2 weeks
      const nextDate = new Date(created.next_job_date);
      nextDate.setDate(nextDate.getDate() + 14);
      await base44.entities.ManualClient.update(created.id, {
        last_job_created_at: new Date().toISOString(),
        next_job_date: nextDate.toISOString().split('T')[0],
      });
      setClients(prev => prev.map(c => c.id === created.id ? { ...c, next_job_date: nextDate.toISOString().split('T')[0] } : c));

      toast.success(`${data.client_name} added and job posted to Available Jobs.`);
    } catch (err) {
      toast.success(`${data.client_name} added.`);
    }
  };

  const activeCount = clients.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Manual Clients</h2>
          <p className="text-sm text-muted-foreground">{activeCount} active · Cash-pay recurring clients (every 2 weeks)</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus size={14} /> Add Client
        </Button>
      </div>

      {showForm && (
        <ClientForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading...</p>
      ) : clients.length === 0 && !showForm ? (
        <div className="text-center py-14 bg-card border border-dashed border-border rounded-xl">
          <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">No manual clients yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add cash-paying clients who don't have an account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              allJobs={allJobs || []}
              onUpdate={(updated) => setClients(prev => prev.map(x => x.id === updated.id ? updated : x))}
              onDelete={(id) => setClients(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}