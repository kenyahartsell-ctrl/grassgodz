import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminEmailPanel() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

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