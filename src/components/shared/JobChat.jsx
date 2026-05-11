import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

const CHAT_ENABLED_STATUSES = ['accepted', 'scheduled', 'in_progress', 'completed'];

const QUICK_REPLIES = [
  'On my way',
  'Running 15 min late',
  'Almost done',
  'Job complete - see photos',
];

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

function MessageSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`h-10 rounded-2xl bg-muted animate-pulse ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
        </div>
      ))}
    </div>
  );
}

export default function JobChat({ job, user, senderRole, otherPartyName }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();
  const chatEnabled = CHAT_ENABLED_STATUSES.includes(job.status);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', job.id],
    queryFn: () => base44.entities.Message.filter({ job_id: job.id }),
    enabled: chatEnabled,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data'],
    select: (msgs) => [...msgs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
  });

  // Mark unread messages from the other party as read
  useEffect(() => {
    if (!chatEnabled || !messages.length) return;
    const unread = messages.filter(m => !m.read_at && m.sender_id !== user.email);
    if (!unread.length) return;
    unread.forEach(m => {
      base44.entities.Message.update(m.id, { read_at: new Date().toISOString() }).catch(() => {});
    });
  }, [messages, user.email, chatEnabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, optimisticMessages]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setInput('');
    setSending(true);

    const optimistic = {
      id: `opt-${Date.now()}`,
      job_id: job.id,
      sender_id: user.email,
      sender_role: senderRole,
      body,
      created_date: new Date().toISOString(),
      _sending: true,
    };
    setOptimisticMessages(prev => [...prev, optimistic]);

    try {
      const newMessage = await base44.entities.Message.create({
        job_id: job.id,
        sender_id: user.email,
        sender_role: senderRole,
        body,
        read_at: null,
      });
      // Fire-and-forget email notification — don't block on it
      base44.functions.invoke('notifyNewMessage', { message: newMessage, job }).catch(() => {});
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
      queryClient.invalidateQueries({ queryKey: ['messages', job.id] });
    } catch {
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (text) => setInput(text);

  const allMessages = [...messages, ...optimisticMessages].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  if (!chatEnabled) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Messaging not available yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          {senderRole === 'customer'
            ? 'Messaging will be enabled once you accept a quote.'
            : 'Messaging will be enabled once the customer accepts your quote.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <MessageSkeleton />
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageCircle className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Say hi to {otherPartyName}!</p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isMine = msg.sender_id === user.email;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  } ${msg._sending ? 'opacity-60' : ''}`}>
                    {msg.body}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-xs text-muted-foreground">{formatTimestamp(msg.created_date)}</span>
                    {isMine && !msg._sending && (
                      <span className="text-xs text-muted-foreground">
                        {msg.read_at ? '· Read' : ''}
                      </span>
                    )}
                    {msg._sending && <span className="text-xs text-muted-foreground">· Sending...</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card flex-shrink-0">
        {/* Quick replies for providers */}
        {senderRole === 'provider' && (
          <div className="flex gap-2 px-3 pt-2 pb-1 overflow-x-auto">
            {QUICK_REPLIES.map(qr => (
              <button
                key={qr}
                onClick={() => handleQuickReply(qr)}
                className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 p-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${otherPartyName}...`}
            rows={1}
            className="flex-1 border border-input rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}