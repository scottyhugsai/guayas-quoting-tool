'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Proposal } from '@/lib/db/proposals';

const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-slate-700 text-slate-200',
  sent:     'bg-blue-900 text-blue-200',
  accepted: 'bg-emerald-900 text-emerald-200',
  rejected: 'bg-red-900 text-red-300',
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proposals').then(r => r.json()).then(setProposals).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Proposals</h1>
          <p className="text-slate-400 text-sm">{proposals.length} total</p>
        </div>
        <Link href="/proposals/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Proposal
        </Link>
      </div>

      {loading ? <div className="text-slate-400 animate-pulse">Loading...</div> : proposals.length === 0 ? (
        <div className="text-slate-500 text-center py-16">No proposals yet</div>
      ) : (
        <div className="space-y-2">
          {proposals.map(p => (
            <Link key={p.id} href={`/proposals/${p.id}`}
              className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl px-5 py-4 transition-colors">
              <div>
                <div className="text-slate-200 font-medium">{p.proposal_number}</div>
                <div className="text-slate-400 text-sm mt-0.5">{p.title || 'Untitled'} · {p.client_name || '—'}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] || 'bg-slate-700 text-slate-300'}`}>
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
