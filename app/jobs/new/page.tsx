'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SERVICE_TYPES } from '@/lib/calculations';
import type { Client } from '@/lib/db/clients';

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', service_type: 'Roofing', stage: 'lead',
    client_id: searchParams.get('client_id') || '',
    description: '', lead_source: '', job_value: '', square_footage: '',
    assigned_crew: '', start_date: '', end_date: '', address: '', notes: '',
  });

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id ? Number(form.client_id) : null,
      job_value: Number(form.job_value) || 0,
      square_footage: form.square_footage ? Number(form.square_footage) : null,
    };
    const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const j = await res.json();
      router.push(`/jobs/${j.id}`);
    } else { setSaving(false); }
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New Job</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Job Info</h2>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Job Title *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Service Type</label>
              <select value={form.service_type} onChange={e => set('service_type', e.target.value)} className={inputClass}>
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)} className={inputClass}>
                {['lead','quote_sent','negotiating','won','in_production','complete','invoiced','paid'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Client</label>
              <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={inputClass}>
                <option value="">— No Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Job Value ($)</label>
              <input type="number" min="0" step="0.01" value={form.job_value} onChange={e => set('job_value', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Assigned Crew</label>
            <input value={form.assigned_crew} onChange={e => set('assigned_crew', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={inputClass} />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Creating...' : 'Create Job'}
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

export default function NewJobPage() {
  return <Suspense fallback={<div className="p-6 text-slate-400">Loading...</div>}><NewJobForm /></Suspense>;
}
