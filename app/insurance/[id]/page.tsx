'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, CLAIM_STATUS_COLORS } from '@/lib/calculations';
import type { InsuranceClaim, Supplement } from '@/lib/db/insurance';

const STATUSES = ['pending', 'approved', 'denied', 'supplement_submitted', 'closed'] as const;
const SUPP_STATUSES = ['submitted', 'approved', 'denied', 'negotiating'] as const;

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [supps, setSupps] = useState<Supplement[]>([]);
  const [showSuppForm, setShowSuppForm] = useState(false);
  const [suppForm, setSuppForm] = useState({ description: '', amount: '', notes: '', status: 'submitted' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/insurance/${id}`).then(r => r.json()).then(setClaim);
    fetch(`/api/insurance/${id}/supplements`).then(r => r.json()).then(setSupps);
  }, [id]);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/insurance/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setClaim(await res.json());
  }

  async function addSupplement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/insurance/${id}/supplements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...suppForm, amount: Number(suppForm.amount) || 0 }),
    });
    if (res.ok) {
      const s = await res.json();
      setSupps(prev => [s, ...prev]);
      setSuppForm({ description: '', amount: '', notes: '', status: 'submitted' });
      setShowSuppForm(false);
    }
    setSaving(false);
  }

  if (!claim) return <div className="p-6 text-slate-400 animate-pulse">Loading...</div>;

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60";

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/insurance" className="text-slate-500 text-sm hover:text-slate-300">← Insurance</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{claim.claim_number || `Claim #${claim.id}`}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${CLAIM_STATUS_COLORS[claim.status]}`}>
              {claim.status.replace(/_/g, ' ')}
            </span>
            {claim.insurance_company && <span className="text-slate-400 text-sm">{claim.insurance_company}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">ACV</div>
          <div className="text-xl font-bold text-slate-200 mt-1">{formatCurrency(claim.acv_amount)}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">RCV</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(claim.rcv_amount)}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">Deductible</div>
          <div className="text-xl font-bold text-red-400 mt-1">{formatCurrency(claim.deductible)}</div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Adjuster</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-slate-500">Name: </span><span className="text-slate-200">{claim.adjuster_name || '—'}</span></div>
          <div><span className="text-slate-500">Phone: </span><span className="text-slate-200">{claim.adjuster_phone || '—'}</span></div>
          <div><span className="text-slate-500">Email: </span><span className="text-slate-200">{claim.adjuster_email || '—'}</span></div>
        </div>
        {claim.scope_of_loss && (
          <div>
            <div className="text-slate-500 text-sm mb-1">Scope of Loss</div>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{claim.scope_of_loss}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-slate-300 font-medium text-sm mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={claim.status === s}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                claim.status === s
                  ? `${CLAIM_STATUS_COLORS[s]} cursor-default`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold">Supplements ({supps.length})</h2>
          <button onClick={() => setShowSuppForm(!showSuppForm)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            {showSuppForm ? 'Cancel' : '+ Add Supplement'}
          </button>
        </div>

        {showSuppForm && (
          <form onSubmit={addSupplement} className="bg-slate-800 border border-amber-500/30 rounded-xl p-5 space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Description *</label>
                <input required value={suppForm.description} onChange={e => setSuppForm(f => ({ ...f, description: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Amount ($)</label>
                <input type="number" min="0" step="0.01" value={suppForm.amount} onChange={e => setSuppForm(f => ({ ...f, amount: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Notes</label>
              <textarea value={suppForm.notes} onChange={e => setSuppForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputClass} />
            </div>
            <button type="submit" disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              {saving ? 'Adding...' : 'Add Supplement'}
            </button>
          </form>
        )}

        {supps.length === 0 ? (
          <p className="text-slate-500 text-sm">No supplements yet</p>
        ) : (
          <div className="space-y-2">
            {supps.map(s => (
              <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-200 text-sm font-medium">{s.description}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-semibold text-sm">{formatCurrency(s.amount)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'approved' ? 'bg-emerald-900 text-emerald-200' :
                      s.status === 'denied' ? 'bg-red-900 text-red-300' :
                      s.status === 'negotiating' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-blue-900 text-blue-200'
                    }`}>{s.status}</span>
                  </div>
                </div>
                {s.notes && <p className="text-slate-400 text-xs mt-1">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
