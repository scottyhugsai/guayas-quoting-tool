'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/lib/db/clients';
import type { Job } from '@/lib/db/jobs';

export default function NewProposalPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', job_id: '', title: '', notes: '' });

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
      title: form.title,
      notes: form.notes,
    };
    const res = await fetch('/api/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const p = await res.json();
      router.push(`/proposals/${p.id}`);
    } else { setSaving(false); }
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New Proposal</h1>
        <p className="text-slate-400 text-sm mt-1">Creates Good / Better / Best tiers automatically</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Roof Replacement" className={inputClass} />
          </div>
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
            <label className="block text-slate-400 text-xs mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={inputClass} />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Creating...' : 'Create Proposal'}
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
