'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, CLAIM_STATUS_COLORS } from '@/lib/calculations';
import type { InsuranceClaim } from '@/lib/db/insurance';

export default function InsurancePage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insurance').then(r => r.json()).then(setClaims).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Insurance Claims</h1>
          <p className="text-slate-400 text-sm">{claims.length} total claims</p>
        </div>
        <Link href="/insurance/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Claim
        </Link>
      </div>

      {loading ? <div className="text-slate-400 animate-pulse">Loading...</div> : claims.length === 0 ? (
        <div className="text-slate-500 text-center py-16">No insurance claims yet</div>
      ) : (
        <div className="space-y-3">
          {claims.map(c => (
            <Link key={c.id} href={`/insurance/${c.id}`}
              className="flex items-start justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl px-5 py-4 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="text-slate-200 font-medium">{c.claim_number || `Claim #${c.id}`}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLAIM_STATUS_COLORS[c.status]}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-slate-400 text-sm mt-1">{c.insurance_company || '—'}</div>
                {c.client_name && <div className="text-slate-500 text-xs mt-0.5">{c.client_name}</div>}
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-amber-400 font-semibold">{formatCurrency(c.rcv_amount)}</div>
                <div className="text-slate-500 text-xs">RCV</div>
                <div className="text-slate-400 text-xs mt-1">{formatCurrency(c.acv_amount)} ACV</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
