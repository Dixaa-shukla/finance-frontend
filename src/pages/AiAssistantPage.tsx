import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, DatabaseZap, Eraser, Lightbulb, Send, Sparkles, WalletCards } from 'lucide-react';
import { assistantService } from '@/api/assistantService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast, type ToastState } from '@/components/common/Toast';
import type { ChatHistoryResponse } from '@/types/assistant';

const PROMPTS = [
  'How can I reduce my monthly spending?',
  'Summarize my financial position.',
  'What should I prioritize for my goals?',
  'Explain my investment performance.',
];

export default function AiAssistantPage() {
  const userId = getCurrentUserId();
  const [messages, setMessages] = useState<ChatHistoryResponse[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      setMessages(await assistantService.getHistory(userId));
      setStatus('success'); setError(null);
    } catch (err) {
      setStatus('error');
      setError(extractErrorMessage(err, 'Could not load your conversation.'));
    }
  }, [userId]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  async function send(message = text) {
    const clean = message.trim();
    if (!clean || !userId || sending) return;
    if (clean.length > 2000) { setToast({ type: 'error', message: 'A message can be at most 2,000 characters.' }); return; }
    const userMessage = { role: 'USER' as const, message: clean, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]); setText(''); setSending(true);
    try {
      const response = await assistantService.sendMessage({ userId, message: clean });
      setMessages((current) => [...current, { role: 'ASSISTANT', message: response.reply, createdAt: response.timestamp }]);
    } catch (err) {
      setMessages((current) => current.filter((item) => item !== userMessage));
      setToast({ type: 'error', message: extractErrorMessage(err, 'Nova AI is temporarily unavailable. Please try again.') });
    } finally { setSending(false); }
  }

  async function reindex() {
    if (!userId) return;
    setIndexing(true);
    try {
      const result = await assistantService.reindex(userId);
      setToast({ type: 'success', message: `${result.documentsIndexed} transactions added to Nova AI context.` });
    } catch (err) { setToast({ type: 'error', message: extractErrorMessage(err, 'Could not refresh financial context.') }); }
    finally { setIndexing(false); }
  }

  async function clearHistory() {
    if (!userId) return;
    try {
      await assistantService.clearHistory(userId); setMessages([]); setClearOpen(false);
      setToast({ type: 'success', message: 'Conversation history cleared.' });
    } catch (err) { setToast({ type: 'error', message: extractErrorMessage(err, 'Could not clear the conversation.') }); }
  }

  return <>
    <div className="space-y-6">
      <Header title="AI Assistant" subtitle="Ask Nova about your finances, goals, spending and investments" action={<Button variant="secondary" icon={<DatabaseZap className="h-4 w-4" />} loading={indexing} onClick={reindex}>Refresh financial context</Button>} />
      {!userId && <EmptyState variant="error" title="Not signed in" description="You need to be signed in to chat with Nova AI." />}
      {userId && status === 'loading' && <AssistantSkeleton />}
      {userId && status === 'error' && <EmptyState variant="error" title="Could not load your conversation" description={error ?? 'Please try again.'} actionLabel="Retry" onAction={load} />}
      {userId && status === 'success' && <section className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="glass-card flex min-h-[650px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-white"><Bot className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold text-navy-900">Nova AI</h2><p className="text-[11px] font-medium text-brand-green">Your private finance companion</p></div></div><button type="button" onClick={() => setClearOpen(true)} disabled={!messages.length} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-navy-700/60 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"><Eraser className="h-3.5 w-3.5" /> Clear chat</button></div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">{messages.length === 0 ? <Welcome onPrompt={send} /> : messages.map((message, index) => <MessageBubble key={`${message.createdAt}-${index}`} message={message} />)}{sending && <TypingBubble />}<div ref={chatEnd} /></div>
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="border-t border-sky-100 p-4"><div className="flex gap-2 rounded-2xl border border-sky-200 bg-white/65 p-2 focus-within:border-brand-blue"><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={1} placeholder="Ask about your money…" className="min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-navy-900 outline-none placeholder:text-navy-700/35" /><button type="submit" aria-label="Send message" disabled={!text.trim() || sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button></div><p className="mt-2 px-2 text-[10px] text-navy-700/45">Nova uses your saved finance data to personalise answers. Avoid sharing sensitive account credentials.</p></form>
        </div>
        <aside className="space-y-4"><div className="glass-card p-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lavender-100 text-brand-purple"><Sparkles className="h-5 w-5" /></div><h2 className="mt-4 text-sm font-extrabold text-navy-900">Try asking Nova</h2><p className="mt-1 text-xs leading-relaxed text-navy-700/60">Start a conversation with a prompt based on your real financial information.</p><div className="mt-4 space-y-2">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} disabled={sending} className="w-full rounded-xl border border-sky-100 bg-white/50 px-3 py-2.5 text-left text-[11px] font-semibold text-navy-700 hover:border-brand-blue/30 hover:bg-sky-50 disabled:opacity-50">{prompt}</button>)}</div></div><div className="rounded-card border border-white/60 bg-gradient-to-br from-sky-100/90 to-lavender-100/80 p-5 shadow-glass"><Lightbulb className="h-5 w-5 text-brand-blue" /><h2 className="mt-3 text-sm font-extrabold text-navy-900">Better answers, fresher context</h2><p className="mt-2 text-xs leading-relaxed text-navy-700/65">Use “Refresh financial context” after adding or changing expenses and income. It indexes your transaction records for more relevant answers.</p></div></aside>
      </section>}
    </div>
    {clearOpen && <ConfirmDialog title="Clear conversation history?" message="This removes all saved messages with Nova AI. This cannot be undone." confirmLabel="Clear history" onConfirm={clearHistory} onCancel={() => setClearOpen(false)} />}
    <Toast toast={toast} onDismiss={() => setToast(null)} />
  </>;
}

function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) { return <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft"><Bot className="h-8 w-8" /></span><h2 className="mt-5 text-xl font-extrabold text-navy-900">Hello, I&apos;m Nova AI</h2><p className="mt-2 text-sm leading-relaxed text-navy-700/60">I can help you understand your spending, goals, budget and investments using the data you&apos;ve saved here.</p><button type="button" onClick={() => onPrompt(PROMPTS[0])} className="mt-5 rounded-pill bg-sky-100 px-4 py-2.5 text-xs font-bold text-brand-blue hover:bg-sky-200">Help me review my spending</button></div>; }
function MessageBubble({ message }: { message: ChatHistoryResponse }) { const assistant = message.role === 'ASSISTANT'; return <div className={`flex gap-2.5 ${assistant ? 'justify-start' : 'justify-end'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${assistant ? 'bg-lavender-100 text-brand-purple' : 'order-2 bg-sky-100 text-brand-blue'}`}>{assistant ? <Bot className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}</span><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${assistant ? 'rounded-tl-sm bg-white/70 text-navy-800' : 'rounded-tr-sm bg-gradient-to-r from-brand-blue to-brand-purple text-white'}`}><p className="whitespace-pre-wrap">{message.message}</p></div></div>; }
function TypingBubble() { return <div className="flex gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender-100 text-brand-purple"><Bot className="h-4 w-4" /></span><div className="rounded-2xl rounded-tl-sm bg-white/70 px-4 py-3"><span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple [animation-delay:300ms]" /></span></div></div>; }
function AssistantSkeleton() { return <div className="grid gap-5 xl:grid-cols-[1fr_300px] animate-pulse"><div className="glass-card h-[650px]" /><div className="glass-card h-80" /></div>; }
