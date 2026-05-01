'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Job } from '@/lib/db/jobs';

export default function NewClaimPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_id: '', claim_number: '', insurance_company: '',
    adjuster_name: '', adjuster_phone: '', adjuster_email: '',
    scope_of_loss: '', acv_amount: '', rcv_amount: '', deductible: '',
    status: 'pending',
  });

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(setJobs);
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.job_id) { alert('Please select a job'); return; }
    setSaving(true);
    const payload = {
      ...form,
      job_id: Number(form.job_id),
      acv_amount: Number(form.acv_amount) || 0,
      rcv_amount: Number(form.rcv_amount) || 0,
      deductible: Number(form.deductible) || 0,
    };
    const res = await fetch('/api/insurance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const c = await res.json();
      router.push(`/insurance/${c.id}`);
    } else { setSaving(false); }
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New Insurance Claim</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Claim Info</h2>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Job *</label>
            <select required value={form.job_id} onChange={e => set('job_id', e.target.value)} className={inputClass}>
              <option value="">— Select Job —</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Claim Number</label>
              <input value={form.claim_number} onChange={e => set('claim_number', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Insurance Company</label>
              <input value={form.insurance_company} onChange={e => set('insurance_company', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Adjuster</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Adjuster Name</label>
              <input value={form.adjuster_name} onChange={e => set('adjuster_name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Adjuster Phone</label>
              <input value={form.adjuster_phone} onChange={e => set('adjuster_phone', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Adjuster Email</label>
            <input type="email" value={form.adjuster_email} onChange={e => set('adjuster_email', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Financials</h2>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Scope of Loss</label>
            <textarea value={form.scope_of_loss} onChange={e => set('scope_of_loss', e.target.value)} rows={3} className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">ACV ($)</label>
              <input type="number" min="0" step="0.01" value={form.acv_amount} onChange={e => set('acv_amount', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">RCV ($)</label>
              <input type="number" min="0" step="0.01" value={form.rcv_amount} onChange={e => set('rcv_amount', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Deductible ($)</label>
              <input type="number" min="0" step="0.01" value={form.deductible} onChange={e => set('deductible', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Creating...' : 'Create Claim'}
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
