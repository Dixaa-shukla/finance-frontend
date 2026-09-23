import { useCallback, useEffect, useState } from 'react';
import { Bot, Check, CircleCheck, Lightbulb, SearchCheck, Sparkles, WandSparkles } from 'lucide-react';
import { categorizationService } from '@/api/categorizationService';
import { categoryService } from '@/api/categoryService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { EXPENSE_TABS } from '@/config/pageTabs';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast, type ToastState } from '@/components/common/Toast';
import type { CategorizationResponse } from '@/types/categorization';

const EXAMPLES = ['Pizza from Domino’s', 'Uber trip to college', 'Amazon shopping order', 'Electricity bill payment'];

export default function AiCategorizationPage() {
  const userId = getCurrentUserId();
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<CategorizationResponse | null>(null);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadCategories = useCallback(async () => {
    if (!userId) return;
    try { setCategories((await categoryService.getForUser(userId, 'EXPENSE')).map((item) => item.name)); }
    catch { setCategories([]); }
    finally { setLoadingCategories(false); }
  }, [userId]);

  useEffect(() => { (async () => { await loadCategories(); })(); }, [loadCategories]);

  async function suggest(value = description) {
    const clean = value.trim();
    if (!userId || !clean) return;
    if (clean.length > 500) { setToast({ type: 'error', message: 'Description can be at most 500 characters.' }); return; }
    setSuggesting(true); setResult(null);
    try {
      const response = await categorizationService.suggest(userId, clean);
      setDescription(clean); setResult(response); setCategory(response.suggestedCategory);
    } catch (err) { setToast({ type: 'error', message: extractErrorMessage(err, 'AI categorization is temporarily unavailable.') }); }
    finally { setSuggesting(false); }
  }

  async function confirm() {
    if (!userId || !result || !category.trim()) return;
    setConfirming(true);
    try {
      const response = await categorizationService.confirm(userId, result.detectedMerchant, category.trim());
      setResult(response); setCategory(response.suggestedCategory);
      setToast({ type: 'success', message: `Nova learned ${response.detectedMerchant} → ${response.suggestedCategory}.` });
    } catch (err) { setToast({ type: 'error', message: extractErrorMessage(err, 'Could not save this categorization.') }); }
    finally { setConfirming(false); }
  }

  return <>
    <div className="space-y-6">
      <Header title="AI Categorization" subtitle="Let Nova identify merchants and suggest the right expense category" />
      <PageTabs tabs={EXPENSE_TABS} />
      {!userId && <EmptyState variant="error" title="Not signed in" description="You need to be signed in to use AI categorization." />}
      {userId && <section className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="glass-card overflow-hidden p-6 sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft"><WandSparkles className="h-6 w-6" /></div><h1 className="mt-5 text-xl font-extrabold text-navy-900">Categorize an expense in seconds</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-700/65">Enter a merchant name or a natural-language expense description. Nova suggests a merchant and category using your saved expense categories.</p>
          <form onSubmit={(event) => { event.preventDefault(); suggest(); }} className="mt-6"><label className="text-xs font-bold text-navy-700">What was this expense?</label><div className="mt-2 flex flex-col gap-2 rounded-2xl border border-sky-200 bg-white/60 p-2 sm:flex-row"><input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="e.g. Paid ₹550 at Domino’s for dinner" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-700/35" /><Button type="submit" icon={<SearchCheck className="h-4 w-4" />} loading={suggesting} disabled={!description.trim()}>Categorize</Button></div><p className="mt-2 text-[11px] text-navy-700/45">{description.length}/500 characters</p></form>
          <div className="mt-5 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} type="button" onClick={() => suggest(example)} disabled={suggesting} className="rounded-pill bg-sky-50 px-3 py-2 text-[11px] font-semibold text-brand-blue hover:bg-sky-100 disabled:opacity-50">{example}</button>)}</div>
          {suggesting && <div className="mt-8 flex items-center gap-3 rounded-2xl bg-sky-50 p-5 text-sm font-semibold text-navy-700"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender-100 text-brand-purple"><Bot className="h-4 w-4 animate-pulse" /></span>Nova is identifying the merchant and category…</div>}
          {result && <div className="mt-8 rounded-2xl border border-white/70 bg-gradient-to-br from-sky-50/80 to-lavender-100/65 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Suggested categorization</p><h2 className="mt-2 text-lg font-extrabold text-navy-900">{result.detectedMerchant}</h2><p className="mt-1 text-xs text-navy-700/60">Detected from “{description}”</p></div><span className={`rounded-pill px-3 py-1.5 text-[10px] font-extrabold ${result.source === 'LEARNED' ? 'bg-emerald-100 text-brand-green' : 'bg-lavender-100 text-brand-purple'}`}>{result.source === 'LEARNED' ? 'Learned from you' : 'AI suggestion'}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]"><label className="block text-xs font-bold text-navy-700">Expense category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-navy-800">{!categories.includes(category) && <option value={category}>{category}</option>}{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>{!loadingCategories && !categories.length && <span className="mt-1 block text-[11px] font-medium text-navy-700/50">No saved categories yet. You can still confirm the suggestion.</span>}</label><div className="flex items-end"><Button onClick={confirm} icon={<Check className="h-4 w-4" />} loading={confirming} disabled={!category.trim()}>Confirm & teach Nova</Button></div></div><p className="mt-4 flex items-center gap-2 text-[11px] leading-relaxed text-navy-700/65"><CircleCheck className="h-4 w-4 shrink-0 text-brand-green" />Confirming saves this merchant-to-category mapping, so similar expenses are faster next time.</p></div>}
        </div>
        <aside className="space-y-4"><div className="glass-card p-5"><Sparkles className="h-5 w-5 text-brand-purple" /><h2 className="mt-3 text-sm font-extrabold text-navy-900">How it works</h2><div className="mt-4 space-y-4">{[['1', 'Describe an expense'], ['2', 'Review Nova’s suggestion'], ['3', 'Confirm or correct it']].map(([step, text]) => <div key={step} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-brand-blue">{step}</span><p className="text-xs font-semibold text-navy-700">{text}</p></div>)}</div></div><div className="rounded-card border border-white/60 bg-gradient-to-br from-lavender-100/80 to-sky-100/80 p-5 shadow-glass"><Lightbulb className="h-5 w-5 text-brand-blue" /><h2 className="mt-3 text-sm font-extrabold text-navy-900">Your categories stay in control</h2><p className="mt-2 text-xs leading-relaxed text-navy-700/65">Nova chooses from your Expense Management categories. You can correct every suggestion before it is learned.</p></div></aside>
      </section>}
    </div>
    <Toast toast={toast} onDismiss={() => setToast(null)} />
  </>;
}
