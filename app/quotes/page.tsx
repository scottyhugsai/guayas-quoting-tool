'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, STATUS_COLORS } from '@/lib/calculations';
import type { Quote } from '@/lib/db';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quotes').then(r => r.json()).then(setQuotes).finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter(q => {
    const matchSearch = !search || q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.service_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = filtered.reduce((s, q) => s + (q.grand_total || q.total), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quotes</h1>
          <p className="text-slate-400 text-sm">{quotes.length} total · {formatCurrency(totalValue)} filtered value</p>
        </div>
        <Link href="/quotes/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Quote
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotes..."
          className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60">
          <option value="">All Status</option>
          {(['draft','sent','accepted','rejected'] as const).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="text-slate-400 animate-pulse">Loading...</div> : filtered.length === 0 ? (
        <div className="text-slate-500 text-center py-16">No quotes found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <Link key={q.id} href={`/quotes/${q.id}`}
              className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl px-5 py-4 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-slate-200 font-medium">{q.quote_number}</div>
                <div className="text-slate-400 text-sm mt-0.5">{q.client_name} · {q.service_type}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-amber-400 font-semibold">{formatCurrency(q.grand_total || q.total)}</div>
                  <div className="text-slate-500 text-xs">{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[q.status]}`}>
                  {q.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
