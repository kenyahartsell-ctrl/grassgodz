import { useState } from 'react';
import { LayoutDashboard, Search, CalendarDays, DollarSign, Star, Leaf, User, TrendingUp, AlertCircle } from 'lucide-react';
import AvailableJobCard from '../components/provider/AvailableJobCard';
import ProviderJobCard from '../components/provider/ProviderJobCard';
import StarRating from '../components/shared/StarRating';
import MetricCard from '../components/shared/MetricCard';
import { MOCK_PROVIDER, MOCK_JOBS, MOCK_REVIEWS, MOCK_EARNINGS } from '../lib/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'available', label: 'Available', icon: Search },
  { key: 'myjobs', label: 'My Jobs', icon: CalendarDays },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function ProviderPortal() {
  const [tab, setTab] = useState('dashboard');
  const [myJobs, setMyJobs] = useState(MOCK_JOBS.filter(j => j.provider_id === 'p1'));
  const [availableJobs, setAvailableJobs] = useState(MOCK_JOBS.filter(j => !j.provider_id));

  const scheduled = myJobs.filter(j => ['scheduled', 'accepted'].includes(j.status));
  const inProgress = myJobs.filter(j => j.status === 'in_progress');
  const completed = myJobs.filter(j => j.status === 'completed');
  const totalEarnings = completed.reduce((sum, j) => sum + (j.provider_payout || 0), 0);

  const handleSubmitQuote = (job, quoteData) => {
    toast.success(`Quote of $${quoteData.price} submitted for ${job.service_name}!`);
  };

  const handleMarkInProgress = (job) => {
    setMyJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'in_progress' } : j));
    toast.success('Job marked as in progress.');
  };

  const handleMarkComplete = (job) => {
    setMyJobs(prev => prev.map(j =>
      j.id === job.id ? { ...j, status: 'completed', completed_at: new Date().toISOString() } : j
    ));
    toast.success(`Job completed! $${(job.quoted_price * 0.75).toFixed(2)} will be transferred to your account.`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">GreenCare</span>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full ml-1">Provider</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{MOCK_PROVIDER.name[0]}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{MOCK_PROVIDER.business_name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Onboarding Banner */}
        {!MOCK_PROVIDER.onboarding_complete && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Complete Stripe Onboarding</p>
              <p className="text-xs text-amber-700 mt-0.5">Connect your bank account to receive payouts for completed jobs.</p>
              <button className="mt-2 text-xs font-semibold text-amber-800 underline">Start Onboarding →</button>
            </div>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Welcome back, {MOCK_PROVIDER.name.split(' ')[0]}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Scheduled" value={scheduled.length} icon={CalendarDays} />
              <MetricCard title="In Progress" value={inProgress.length} icon={TrendingUp} color="text-orange-600" bgColor="bg-orange-100" />
              <MetricCard title="Total Completed" value={MOCK_PROVIDER.total_jobs_completed} icon={Star} color="text-amber-600" bgColor="bg-amber-100" />
              <MetricCard title="Avg Rating" value={MOCK_PROVIDER.avg_rating} icon={Star} color="text-amber-500" bgColor="bg-amber-50" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Monthly Earnings</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={MOCK_EARNINGS}>
                  <defs>
                    <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142,60%,28%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(142,60%,28%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Earnings']} />
                  <Area type="monotone" dataKey="earnings" stroke="hsl(142,60%,28%)" fill="url(#eg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {inProgress.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">In Progress</h3>
                <div className="space-y-3">
                  {inProgress.map(j => (
                    <ProviderJobCard key={j.id} job={j} onMarkComplete={handleMarkComplete} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'available' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Available Jobs</h2>
              <p className="text-sm text-muted-foreground">Jobs in your service area · ZIP {MOCK_PROVIDER.service_zip_codes.join(', ')}</p>
            </div>
            {availableJobs.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No available jobs right now</p>
                <p className="text-sm text-muted-foreground mt-1">New requests will appear here as customers submit them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableJobs.map(j => (
                  <AvailableJobCard key={j.id} job={j} onSubmitQuote={handleSubmitQuote} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'myjobs' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">My Jobs</h2>
            {inProgress.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-orange-700 mb-3">In Progress</h3>
                <div className="space-y-3">
                  {inProgress.map(j => <ProviderJobCard key={j.id} job={j} onMarkComplete={handleMarkComplete} />)}
                </div>
              </div>
            )}
            {scheduled.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Scheduled</h3>
                <div className="space-y-3">
                  {scheduled.map(j => <ProviderJobCard key={j.id} job={j} onMarkInProgress={handleMarkInProgress} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Completed</h3>
                <div className="space-y-3">
                  {completed.map(j => <ProviderJobCard key={j.id} job={j} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Earnings</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <MetricCard title="Total Earned" value={`$${totalEarnings.toFixed(2)}`} icon={DollarSign} />
              <MetricCard title="Pending Payout" value="$41.25" icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-100" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 mb-5">
              <h3 className="text-sm font-bold text-foreground mb-1">Pay Structure</h3>
              <p className="text-xs text-muted-foreground mb-3">GreenCare takes 25% platform fee on each job.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">You receive</p>
                  <p className="text-xl font-bold text-primary">75%</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Platform fee</p>
                  <p className="text-xl font-bold text-muted-foreground">25%</p>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
            <div className="space-y-2">
              {completed.map(j => (
                <div key={j.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{j.service_name}</p>
                    <p className="text-xs text-muted-foreground">{j.completed_at ? new Date(j.completed_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">+${j.provider_payout?.toFixed(2) || '—'}</p>
                    <p className="text-xs text-muted-foreground">of ${j.final_price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Profile</h2>
            <div className="bg-card border border-border rounded-xl p-5 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{MOCK_PROVIDER.name[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{MOCK_PROVIDER.business_name}</p>
                  <p className="text-sm text-muted-foreground">{MOCK_PROVIDER.name}</p>
                  <StarRating rating={MOCK_PROVIDER.avg_rating} showValue />
                </div>
              </div>
              <hr className="border-border mb-4" />
              <div className="space-y-3">
                {[
                  { label: 'Email', value: MOCK_PROVIDER.user_email },
                  { label: 'Experience', value: `${MOCK_PROVIDER.years_experience} years` },
                  { label: 'Service ZIPs', value: MOCK_PROVIDER.service_zip_codes.join(', ') },
                  { label: 'Total Jobs', value: MOCK_PROVIDER.total_jobs_completed },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-sm text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Bio</p>
                  <p className="text-sm text-foreground mt-0.5">{MOCK_PROVIDER.bio}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Reviews ({MOCK_REVIEWS.filter(r => r.provider_id === 'p1').length})</h3>
              <div className="space-y-3">
                {MOCK_REVIEWS.filter(r => r.provider_id === 'p1').map(r => (
                  <div key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{r.customer_name}</span>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-30">
        <div className="max-w-3xl mx-auto flex">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}