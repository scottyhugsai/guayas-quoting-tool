'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Client } from '@/lib/db/clients';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients).finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Clients</h1>
          <p className="text-slate-400 text-sm">{clients.length} total clients</p>
        </div>
        <Link href="/clients/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Client
        </Link>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, or phone..."
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60"
      />

      {loading ? (
        <div className="text-slate-400 animate-pulse">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-500 text-center py-16">No clients found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Link key={c.id} href={`/clients/${c.id}`} className="bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl p-4 transition-colors">
              <div className="font-semibold text-slate-100">{c.name}</div>
              <div className="text-slate-400 text-sm mt-1">{c.email || '—'}</div>
              <div className="text-slate-400 text-sm">{c.phone || '—'}</div>
              <div className="text-slate-500 text-xs mt-2">{[c.city, c.state].filter(Boolean).join(', ')}</div>
              <div className="mt-2">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{c.lead_source}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
