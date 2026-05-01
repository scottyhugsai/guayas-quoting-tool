'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Quote } from '@/lib/db';
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/calculations';

const STATUS_FILTERS = ['all', 'draft', 'sent', 'accepted', 'rejected'] as const;
type FilterType = typeof STATUS_FILTERS[number];

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) setQuotes(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, []);

  const stats = useMemo(() => {
    const counts = { draft: 0, sent: 0, accepted: 0, rejected: 0 };
    let totalValue = 0;
    let acceptedValue = 0;
    for (const q of quotes) {
      counts[q.status]++;
      totalValue += q.total;
      if (q.status === 'accepted') acceptedValue += q.total;
    }
    return { counts, totalValue, acceptedValue, total: quotes.length };
  }, [quotes]);

  const filtered = useMemo(() => {
    return quotes.filter(q => {
      if (filter !== 'all' && q.status !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          q.client_name.toLowerCase().includes(s) ||
          q.quote_number.toLowerCase().includes(s) ||
          q.service_type.toLowerCase().includes(s) ||
          q.address.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [quotes, filter, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this quote? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      setQuotes(prev => prev.filter(q => q.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: number, status: Quote['status']) => {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setQuotes(prev => prev.map(q => q.id === id ? updated : q));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your client quotes</p>
        </div>
        <Link
          href="/quotes/new"
          className="px-4 py-2.5 bg-[#1a5c2e] hover:bg-[#134524] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          + New Quote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Quotes" value={stats.total} sub={formatCurrency(stats.totalValue)} dark />
        <StatCard label="Draft" value={stats.counts.draft} valueColor="text-gray-600" />
        <StatCard label="Sent" value={stats.counts.sent} valueColor="text-blue-600" />
        <StatCard label="Accepted" value={stats.counts.accepted} valueColor="text-green-600" />
        <StatCard label="Rejected" value={stats.counts.rejected} valueColor="text-red-600" />
        <StatCard label="Won Value" value={formatCurrency(stats.acceptedValue)} valueColor="text-green-600" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f ? 'bg-[#1a5c2e] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? `All (${stats.total})` : `${STATUS_LABELS[f]} (${stats.counts[f]})`}
            </button>
          ))}
        </div>
        <input
          className="sm:ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#1a5c2e] focus:border-transparent"
          placeholder="Search client, quote #, service…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading quotes…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm mb-3">
              {quotes.length === 0 ? 'No quotes yet.' : 'No quotes match your filter.'}
            </p>
            {quotes.length === 0 && (
              <Link href="/quotes/new" className="text-[#1a5c2e] font-medium text-sm hover:underline">
                Create your first quote →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Quote #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Service</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{q.quote_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{q.client_name}</div>
                      {q.address && (
                        <div className="text-xs text-gray-400 truncate max-w-[160px]">{q.address}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{q.service_type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{formatDate(q.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(q.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={q.status}
                        onChange={e => handleStatusChange(q.id, e.target.value as Quote['status'])}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer appearance-none ${
                          q.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          q.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/quotes/${q.id}`} className="text-[#1a5c2e] hover:underline text-xs font-medium">
                          View
                        </Link>
                        <Link href={`/quotes/${q.id}/edit`} className="text-gray-500 hover:text-gray-700 text-xs">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deleting === q.id}
                          className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50"
                        >
                          {deleting === q.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, dark = false, valueColor = 'text-[#1a5c2e]',
}: {
  label: string;
  value: string | number;
  sub?: string;
  dark?: boolean;
  valueColor?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? 'bg-[#1a5c2e] border-[#1a5c2e]' : 'bg-white border-gray-200'}`}>
      <div className={`text-xs font-medium mb-1 ${dark ? 'text-green-200' : 'text-gray-500'}`}>{label}</div>
      <div className={`text-xl font-bold ${dark ? 'text-white' : valueColor}`}>{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${dark ? 'text-green-200' : 'text-gray-400'}`}>{sub}</div>}
    </div>
  );
}
