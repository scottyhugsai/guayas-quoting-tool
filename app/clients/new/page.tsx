'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LEAD_SOURCES = ['unknown', 'referral', 'google', 'facebook', 'instagram', 'door_knock', 'yard_sign', 'repeat', 'insurance', 'other'];

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', city: 'Charleston', state: 'SC', zip: '',
    phone: '', email: '', lead_source: 'unknown', notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const c = await res.json();
      router.push(`/clients/${c.id}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New Client</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Contact Info</h2>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Full Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Address</h2>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Street Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-slate-400 text-xs mb-1">City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">ZIP</label>
              <input value={form.zip} onChange={e => set('zip', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Lead Source</label>
            <select value={form.lead_source} onChange={e => set('lead_source', e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60">
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Saving...' : 'Create Client'}
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
