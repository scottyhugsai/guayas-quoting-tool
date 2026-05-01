'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SERVICE_TYPES, calculateTotals, formatCurrency } from '@/lib/calculations';
import type { Quote, Material } from '@/lib/db';

interface QuoteFormProps {
  initialData?: Quote;
  defaultSettings?: { markup_percent: string; labor_rate: string };
}

const emptyMaterial = (): Material => ({ name: '', quantity: 1, unit_cost: 0, unit: 'unit' });

export default function QuoteForm({ initialData, defaultSettings }: QuoteFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [upsells, setUpsells] = useState<{ title: string; description: string; estimated_value: number }[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);

  const [clientName, setClientName] = useState(initialData?.client_name ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [serviceType, setServiceType] = useState(initialData?.service_type ?? SERVICE_TYPES[0]);
  const [squareFootage, setSquareFootage] = useState<string>(
    initialData?.square_footage != null ? String(initialData.square_footage) : ''
  );
  const [materials, setMaterials] = useState<Material[]>(
    initialData?.materials?.length ? initialData.materials : [emptyMaterial()]
  );
  const [laborHours, setLaborHours] = useState<string>(String(initialData?.labor_hours ?? 0));
  const [laborRate, setLaborRate] = useState<string>(
    String(initialData?.labor_rate ?? defaultSettings?.labor_rate ?? 75)
  );
  const [markupPercent, setMarkupPercent] = useState<string>(
    String(initialData?.markup_percent ?? defaultSettings?.markup_percent ?? 20)
  );
  const [taxRate, setTaxRate] = useState<string>(String(initialData?.tax_rate ?? 0));
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'flat'>(initialData?.discount_type ?? 'none');
  const [discountValue, setDiscountValue] = useState<string>(String(initialData?.discount_value ?? 0));
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [status, setStatus] = useState<Quote['status']>(initialData?.status ?? 'draft');

  const totals = calculateTotals(
    materials,
    parseFloat(laborHours) || 0,
    parseFloat(laborRate) || 0,
    parseFloat(markupPercent) || 0,
    parseFloat(taxRate) || 0,
    discountType,
    parseFloat(discountValue) || 0
  );

  const addMaterial = () => setMaterials(prev => [...prev, emptyMaterial()]);
  const removeMaterial = (i: number) => setMaterials(prev => prev.filter((_, idx) => idx !== i));
  const updateMaterial = useCallback((i: number, field: keyof Material, value: string) => {
    setMaterials(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      if (field === 'name' || field === 'unit') return { ...m, [field]: value };
      return { ...m, [field]: parseFloat(value) || 0 };
    }));
  }, []);

  async function fetchUpsells() {
    setLoadingUpsells(true);
    try {
      const res = await fetch('/api/ai/suggest-upsells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          currentScope: notes || 'standard installation',
          jobValue: totals.grand_total,
        }),
      });
      if (res.ok) {
        const { suggestions } = await res.json();
        setUpsells(suggestions || []);
      }
    } finally { setLoadingUpsells(false); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { setError('Client name is required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      client_name: clientName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      service_type: serviceType,
      square_footage: squareFootage ? parseFloat(squareFootage) : null,
      materials: materials.filter(m => m.name.trim()),
      labor_hours: parseFloat(laborHours) || 0,
      labor_rate: parseFloat(laborRate) || 0,
      markup_percent: parseFloat(markupPercent) || 0,
      tax_rate: parseFloat(taxRate) || 0,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      notes: notes.trim(),
      status,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/quotes/${initialData!.id}` : '/api/quotes',
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      router.push(`/quotes/${saved.id}`);
    } catch {
      setError('Failed to save quote. Please try again.');
    } finally { setSaving(false); }
  };

  const inputClass = 'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60';
  const labelClass = 'block text-slate-400 text-xs font-medium mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Client Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Name *</label>
            <input className={inputClass} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Smith" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Service Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Service Type *</label>
            <select className={inputClass} value={serviceType} onChange={e => setServiceType(e.target.value)}>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Square Footage</label>
            <input className={inputClass} type="number" min="0" step="0.01" value={squareFootage} onChange={e => setSquareFootage(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Materials</h2>
          <button type="button" onClick={addMaterial} className="text-amber-400 text-xs hover:text-amber-300">+ Add Row</button>
        </div>
        <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-1">
          <span className="col-span-5 text-slate-500 text-xs uppercase tracking-wide">Material</span>
          <span className="col-span-2 text-slate-500 text-xs uppercase tracking-wide">Qty</span>
          <span className="col-span-3 text-slate-500 text-xs uppercase tracking-wide">Unit Cost</span>
          <span className="col-span-2 text-slate-500 text-xs uppercase tracking-wide text-right">Total</span>
        </div>
        {materials.map((mat, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              <input className={inputClass} placeholder="Material name" value={mat.name} onChange={e => updateMaterial(i, 'name', e.target.value)} />
            </div>
            <div className="col-span-2">
              <input className={inputClass} type="number" min="0" step="0.01" placeholder="1" value={mat.quantity || ''} onChange={e => updateMaterial(i, 'quantity', e.target.value)} />
            </div>
            <div className="col-span-3">
              <input className={inputClass} type="number" min="0" step="0.01" placeholder="0.00" value={mat.unit_cost || ''} onChange={e => updateMaterial(i, 'unit_cost', e.target.value)} />
            </div>
            <div className="col-span-1 text-right text-xs font-medium text-slate-400">
              {formatCurrency(mat.quantity * mat.unit_cost)}
            </div>
            <div className="col-span-1 text-right">
              <button type="button" onClick={() => removeMaterial(i)} disabled={materials.length === 1}
                className="text-red-500 hover:text-red-400 text-lg leading-none px-1 disabled:opacity-30">×</button>
            </div>
          </div>
        ))}
        <div className="text-right text-sm text-slate-400 pt-1 border-t border-slate-700">
          Materials: <span className="text-slate-200 font-medium">{formatCurrency(totals.materials_total)}</span>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Labor & Pricing</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Labor Hours</label>
            <input className={inputClass} type="number" min="0" step="0.5" value={laborHours} onChange={e => setLaborHours(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Rate ($/hr)</label>
            <input className={inputClass} type="number" min="0" step="1" value={laborRate} onChange={e => setLaborRate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Markup %</label>
            <input className={inputClass} type="number" min="0" max="200" step="0.5" value={markupPercent} onChange={e => setMarkupPercent(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Tax %</label>
            <input className={inputClass} type="number" min="0" max="30" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Discount Type</label>
            <select className={inputClass} value={discountType} onChange={e => setDiscountType(e.target.value as 'none' | 'percent' | 'flat')}>
              <option value="none">No Discount</option>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat ($)</option>
            </select>
          </div>
          {discountType !== 'none' && (
            <div>
              <label className={labelClass}>{discountType === 'percent' ? 'Discount %' : 'Discount $'}</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-lg p-4 space-y-2">
          {[
            { label: 'Materials', val: totals.materials_total },
            { label: `Labor (${laborHours || 0}h × $${laborRate || 0}/hr)`, val: totals.labor_total },
            { label: 'Subtotal', val: totals.subtotal, border: true },
            { label: `Markup (${markupPercent || 0}%)`, val: totals.markup_amount },
          ].map(({ label, val, border }) => (
            <div key={label} className={`flex justify-between text-sm ${border ? 'border-t border-slate-700 pt-2' : ''}`}>
              <span className="text-slate-400">{label}</span>
              <span className="text-slate-200">{formatCurrency(val)}</span>
            </div>
          ))}
          {totals.discount_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-400">Discount</span>
              <span className="text-emerald-400">-{formatCurrency(totals.discount_amount)}</span>
            </div>
          )}
          {totals.tax_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax ({taxRate}%)</span>
              <span className="text-slate-200">{formatCurrency(totals.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t-2 border-amber-500/40 pt-2 mt-1">
            <span className="text-slate-100">Total</span>
            <span className="text-amber-400 text-lg">{formatCurrency(totals.grand_total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Notes & Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes / Scope of Work</label>
            <textarea className={`${inputClass} min-h-24 resize-y`} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Scope details, timeline, material specs..." />
          </div>
          <div>
            <label className={labelClass}>Quote Status</label>
            <select className={inputClass} value={status} onChange={e => setStatus(e.target.value as Quote['status'])}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Upsell Suggestions */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">AI Upsell Ideas</h2>
          <button type="button" onClick={fetchUpsells} disabled={loadingUpsells}
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {loadingUpsells ? 'Thinking...' : '✨ Suggest Upsells'}
          </button>
        </div>
        {upsells.length > 0 && (
          <div className="space-y-2">
            {upsells.map((u, i) => (
              <div key={i} className="bg-slate-900 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 text-sm font-medium">{u.title}</span>
                  <span className="text-amber-400 text-sm font-semibold">+{formatCurrency(u.estimated_value)}</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">{u.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 rounded-lg text-sm font-semibold transition-colors">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Quote'}
        </button>
      </div>
    </form>
  );
}
