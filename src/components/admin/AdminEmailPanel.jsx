import { useState } from 'react';
import { Send, Loader2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminEmailPanel() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateProviderBlast = async () => {
    setGenerating(true);
    try {
      // Fetch available (requested/quoted) jobs
      const allJobs = await base44.entities.Job.list('-created_date', 200);
      const available = allJobs.filter(j => ['requested', 'quoted'].includes(j.status) && !j.provider_id);

      const jobLines = available.length > 0
        ? available.map((j, i) => {
            const date = j.scheduled_date
              ? new Date(j.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Date TBD';
            const price = j.quoted_price ? ` — $${j.quoted_price.toFixed(2)}` : '';
            return `  ${i + 1}. ${j.service_name || 'Lawn Service'} · ${j.address || j.zip_code}${price} · ${date}`;
          }).join('\n')
        : '  No open jobs at this time — check back soon!';

      const emailBody = `Hey Grassgodz Crew! 🌿☀️

Summer is HERE and the lawns aren't going to mow themselves! We've got jobs lined up and ready for you — first come, first served. Don't let another provider snag them before you do!

🏡 AVAILABLE JOBS RIGHT NOW:
${jobLines}

Log in to your provider portal to claim a job before it's gone:
👉 https://grassgodz.com/provider

💰 REMINDER: You keep 90% of every completed job. That means more money in YOUR pocket for every lawn you knock out this season. The more jobs you take, the bigger your summer earnings!

The sun is out, the season is peaking — let's make it count together. We're grateful to have you as part of the Grassgodz team and we can't wait to see you crush it this summer. 🌞

Thank you for being a Grassgodz provider. You make it all happen!

Let's get it,
The Grassgodz Team 🌱`;

      setSubject('🌿 Available Jobs This Week — Claim Yours Before They\'re Gone!');
      setBody(emailBody);
      toast.success(`Template generated with ${available.length} available job${available.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error('Failed to load jobs: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const res = await base44.functions.invoke('adminSendEmail', {
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });

      if (res.data.success) {
        toast.success(`Email sent to ${to}`);
        setTo('');
        setSubject('');
        setBody('');
      } else {
        toast.error(res.data.error || 'Failed to send email');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">

      {/* Quick Generate */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-1">📢 Provider Job Blast</p>
        <p className="text-xs text-muted-foreground mb-3">Auto-generate an upbeat email with all currently available jobs, pre-written and ready to send.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateProviderBlast}
          disabled={generating}
          className="w-full border-primary/30 text-primary hover:bg-primary/10"
        >
          {generating ? (
            <><Loader2 size={13} className="animate-spin mr-2" /> Generating...</>
          ) : (
            <><Zap size={13} className="mr-2" /> Generate Provider Blast Email</>
          )}
        </Button>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Recipient Email</label>
        <input
          type="email"
          placeholder="provider@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Subject</label>
        <input
          type="text"
          placeholder="Email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Message</label>
        <textarea
          placeholder="Write your message here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={sending || !to || !subject || !body}
        className="w-full"
      >
        {sending ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send size={14} className="mr-2" />
            Send Email
          </>
        )}
      </Button>
    </div>
  );
}