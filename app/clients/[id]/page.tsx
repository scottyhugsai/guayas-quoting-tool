'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';
import type { Client } from '@/lib/db/clients';
import type { Job } from '@/lib/db/jobs';
import type { Quote } from '@/lib/db';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ client: Client; jobs: Job[]; quotes: Quote[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(d => {
      setData(d);
      setForm(d.client);
    });
  }, [id]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(d => d ? { ...d, client: updated } : d);
      setEditing(false);
    }
    setSaving(false);
  }

  async function deleteClient() {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    router.push('/clients');
  }

  if (!data) return <div className="p-6 text-slate-400 animate-pulse">Loading...</div>;
  const { client, jobs, quotes } = data;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/clients" className="text-slate-500 text-sm hover:text-slate-300">← Clients</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{client.name}</h1>
          <div className="text-slate-400 text-sm">{client.email} · {client.phone}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={deleteClient}
            className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors">
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          {(['name','email','phone','address','city','state','zip','notes'] as const).map(f => (
            <div key={f}>
              <label className="block text-slate-400 text-xs mb-1 capitalize">{f}</label>
              {f === 'notes' ? (
                <textarea value={form[f] ?? ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} rows={3}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
              ) : (
                <input value={form[f] ?? ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
              )}
            </div>
          ))}
          <button onClick={save} disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-2">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">Contact</h3>
            <div className="text-slate-200 text-sm">{client.address}</div>
            <div className="text-slate-200 text-sm">{[client.city, client.state, client.zip].filter(Boolean).join(', ')}</div>
            <div className="text-slate-200 text-sm">{client.phone}</div>
            <div className="text-slate-200 text-sm">{client.email}</div>
            <div className="text-xs text-slate-500 mt-2">Source: {client.lead_source}</div>
          </div>
          {client.notes && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">Notes</h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold">Jobs ({jobs.length})</h2>
          <Link href={`/jobs/new?client_id=${id}`} className="text-amber-400 text-sm hover:text-amber-300">+ New Job</Link>
        </div>
        {jobs.length === 0 ? <p className="text-slate-500 text-sm">No jobs yet</p> : (
          <div className="space-y-2">
            {jobs.map((j: Job) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-lg px-4 py-3 transition-colors">
                <div>
                  <div className="text-slate-200 text-sm font-medium">{j.title}</div>
                  <div className="text-slate-400 text-xs">{j.service_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 text-sm">{formatCurrency(j.job_value)}</div>
                  <div className="text-slate-500 text-xs">{j.stage}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold">Quotes ({quotes.length})</h2>
          <Link href={`/quotes/new?client_id=${id}`} className="text-amber-400 text-sm hover:text-amber-300">+ New Quote</Link>
        </div>
        {quotes.length === 0 ? <p className="text-slate-500 text-sm">No quotes yet</p> : (
          <div className="space-y-2">
            {quotes.map((q: Quote) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-lg px-4 py-3 transition-colors">
                <div>
                  <div className="text-slate-200 text-sm font-medium">{q.quote_number}</div>
                  <div className="text-slate-400 text-xs">{q.service_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 text-sm">{formatCurrency(q.grand_total || q.total)}</div>
                  <div className="text-slate-500 text-xs">{q.status}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
