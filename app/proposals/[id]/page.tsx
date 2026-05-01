'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, calculateTotals } from '@/lib/calculations';
import type { Proposal, ProposalTier } from '@/lib/db/proposals';
import type { Material } from '@/lib/db';

const TIER_COLORS = {
  good:   { border: 'border-slate-600', bg: 'bg-slate-800', label: 'text-slate-300', badge: 'bg-slate-700 text-slate-200' },
  better: { border: 'border-blue-700',  bg: 'bg-slate-800', label: 'text-blue-300',  badge: 'bg-blue-900 text-blue-200' },
  best:   { border: 'border-amber-600', bg: 'bg-slate-800', label: 'text-amber-300', badge: 'bg-amber-900 text-amber-200' },
};

function TierPanel({ tier, proposalId, onUpdate }: { tier: ProposalTier; proposalId: number; onUpdate: (t: ProposalTier) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    labor_hours: tier.labor_hours,
    labor_rate: tier.labor_rate,
    markup_percent: tier.markup_percent,
    tax_rate: tier.tax_rate,
    discount_type: tier.discount_type,
    discount_value: tier.discount_value,
    notes: tier.notes,
  });
  const [materials, setMaterials] = useState<Material[]>(tier.materials || []);
  const [saving, setSaving] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const totals = calculateTotals(
    materials, form.labor_hours, form.labor_rate, form.markup_percent,
    form.tax_rate, form.discount_type as 'none'|'percent'|'flat', form.discount_value
  );

  async function save() {
    setSaving(true);
    const payload = { ...form, materials, ...totals };
    const res = await fetch(`/api/proposals/${proposalId}/tiers/${tier.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) { onUpdate(await res.json()); setEditing(false); }
    setSaving(false);
  }

  async function selectTier() {
    setSelecting(true);
    await fetch(`/api/proposals/${proposalId}/tiers/${tier.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ select: true }),
    });
    window.location.reload();
  }

  function addMaterial() {
    setMaterials(m => [...m, { name: '', quantity: 1, unit: 'unit', unit_cost: 0 }]);
  }

  const colors = TIER_COLORS[tier.tier];

  return (
    <div className={`${colors.bg} border-2 ${tier.is_selected ? 'border-amber-500' : colors.border} rounded-xl overflow-hidden`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${colors.badge}`}>{tier.tier}</span>
          <span className={`text-sm font-medium ${colors.label}`}>{tier.label}</span>
          {tier.is_selected && <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">Selected</span>}
        </div>
        <div className="text-amber-400 font-bold text-xl">{formatCurrency(tier.total || totals.grand_total)}</div>
      </div>

      {editing ? (
        <div className="p-4 border-t border-slate-700 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Labor Hours', key: 'labor_hours' },
              { label: 'Labor Rate ($/hr)', key: 'labor_rate' },
              { label: 'Markup %', key: 'markup_percent' },
              { label: 'Tax %', key: 'tax_rate' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-slate-400 text-xs mb-1">{label}</label>
                <input type="number" min="0" step="0.01"
                  value={form[key as keyof typeof form] as number}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60" />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-400 text-xs">Materials</label>
              <button type="button" onClick={addMaterial} className="text-amber-400 text-xs hover:text-amber-300">+ Add</button>
            </div>
            {materials.map((m, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input placeholder="Name" value={m.name} onChange={e => setMaterials(ms => ms.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  className="col-span-2 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs" />
                <input type="number" placeholder="Qty" value={m.quantity} onChange={e => setMaterials(ms => ms.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs" />
                <input type="number" placeholder="$/unit" value={m.unit_cost} onChange={e => setMaterials(ms => ms.map((x, j) => j === i ? { ...x, unit_cost: Number(e.target.value) } : x))}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs" />
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-400"><span>Materials</span><span>{formatCurrency(totals.materials_total)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Labor</span><span>{formatCurrency(totals.labor_total)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Markup</span><span>{formatCurrency(totals.markup_amount)}</span></div>
            {totals.discount_amount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatCurrency(totals.discount_amount)}</span></div>}
            {totals.tax_amount > 0 && <div className="flex justify-between text-slate-400"><span>Tax</span><span>{formatCurrency(totals.tax_amount)}</span></div>}
            <div className="flex justify-between text-amber-400 font-bold border-t border-slate-700 pt-1"><span>Total</span><span>{formatCurrency(totals.grand_total)}</span></div>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-4 py-2 rounded-lg text-xs transition-colors">
              {saving ? 'Saving...' : 'Save Tier'}
            </button>
            <button onClick={() => setEditing(false)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-xs transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
            <span>Labor: {tier.labor_hours}h @ ${tier.labor_rate}/hr</span>
            <span>Markup: {tier.markup_percent}%</span>
            {tier.tax_rate > 0 && <span>Tax: {tier.tax_rate}%</span>}
          </div>
          {tier.notes && <p className="text-slate-400 text-xs mb-3">{tier.notes}</p>}
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs transition-colors">
              Edit
            </button>
            {!tier.is_selected && (
              <button onClick={selectTier} disabled={selecting}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors">
                {selecting ? 'Selecting...' : 'Select This Tier'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    fetch(`/api/proposals/${id}`).then(r => r.json()).then(setProposal);
  }, [id]);

  function updateTier(updated: ProposalTier) {
    setProposal(p => p ? { ...p, tiers: p.tiers?.map(t => t.id === updated.id ? updated : t) } : p);
  }

  if (!proposal) return <div className="p-6 text-slate-400 animate-pulse">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link href="/proposals" className="text-slate-500 text-sm hover:text-slate-300">← Proposals</Link>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">{proposal.proposal_number}</h1>
        <div className="text-slate-400 text-sm mt-1">{proposal.title} · {proposal.client_name || '—'}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {proposal.tiers?.map(tier => (
          <TierPanel key={tier.id} tier={tier} proposalId={proposal.id} onUpdate={updateTier} />
        ))}
      </div>
    </div>
  );
}
