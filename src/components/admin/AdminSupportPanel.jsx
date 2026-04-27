import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminSupportPanel({ jobs }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const filteredJobs = jobs.filter(j =>
    !searchQuery ||
    j.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.provider_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedJob) return;
    loadMessages(selectedJob.id);
  }, [selectedJob]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (jobId) => {
    setLoadingMessages(true);
    try {
      const msgs = await base44.entities.Message.filter({ job_id: jobId });
      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMessages(msgs);
    } catch {
      toast.error('Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedJob) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        job_id: selectedJob.id,
        sender_id: 'admin',
        sender_role: 'provider', // admin sends as support
        body: `[Admin Support] ${newMessage.trim()}`,
      });
      setNewMessage('');
      await loadMessages(selectedJob.id);
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
      {/* Job list */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No jobs found.</p>
            </div>
          ) : (
            filteredJobs.map(j => (
              <button
                key={j.id}
                onClick={() => setSelectedJob(j)}
                className={`w-full text-left px-3 py-3 border-b border-border transition-colors hover:bg-muted/40 ${selectedJob?.id === j.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
              >
                <p className="text-sm font-semibold text-foreground truncate">{j.service_name}</p>
                <p className="text-xs text-muted-foreground truncate">{j.customer_name} → {j.provider_name || 'Unassigned'}</p>
                <div className="mt-1">
                  <StatusBadge status={j.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        {!selectedJob ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Select a job to view messages</p>
            <p className="text-xs text-muted-foreground mt-1">You can read the full conversation and send admin support messages.</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedJob.service_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedJob.customer_name} ↔ {selectedJob.provider_name || 'Unassigned'} · {selectedJob.address}</p>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-muted-foreground">No messages yet for this job.</p>
                </div>
              ) : (
                messages.map(m => {
                  const isAdmin = m.sender_id === 'admin';
                  const isProvider = m.sender_role === 'provider' && !isAdmin;
                  return (
                    <div key={m.id} className={`flex ${isProvider || isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-900'
                          : isProvider
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-xs font-semibold mb-0.5 opacity-70">
                          {isAdmin ? '🛡 Admin' : isProvider ? 'Provider' : 'Customer'}
                        </p>
                        <p>{m.body}</p>
                        <p className="text-xs opacity-50 mt-1">{new Date(m.created_date).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Send a support message..."
                className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}