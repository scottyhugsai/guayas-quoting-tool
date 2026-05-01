'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/lib/db/clients';
import type { Job } from '@/lib/db/jobs';

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: '', job_id: '', amount: '', due_date: '', payment_notes: '', status: 'draft',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/jobs').then(r => r.json()),
    ]).then(([c, j]) => { setClients(c); setJobs(j); });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      client_id: form.client_id ? Number(form.client_id) : null,
      job_id: form.job_id ? Number(form.job_id) : null,
      amount: Number(form.amount),
      due_date: form.due_date || null,
      payment_notes: form.payment_notes,
      status: form.status,
    };
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    } else { setSaving(false); }
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New Invoice</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Client</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={inputClass}>
              <option value="">— Select Client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Job</label>
            <select value={form.job_id} onChange={e => set('job_id', e.target.value)} className={inputClass}>
              <option value="">— Select Job —</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Amount ($) *</label>
            <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Notes</label>
            <textarea value={form.payment_notes} onChange={e => set('payment_notes', e.target.value)} rows={3} className={inputClass} />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-6 py-2.5 rounded-lg text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
