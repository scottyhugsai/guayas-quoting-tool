'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SERVICE_TYPES, calculateTotals, formatCurrency } from '@/lib/calculations';
import type { Quote, Material } from '@/lib/db';

interface QuoteFormProps {
  initialData?: Quote;
  defaultSettings?: { markup_percent: string; labor_rate: string };
}

const emptyMaterial = (): Material => ({ name: '', quantity: 1, unit_cost: 0 });

export default function QuoteForm({ initialData, defaultSettings }: QuoteFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [status, setStatus] = useState<Quote['status']>(initialData?.status ?? 'draft');

  const totals = calculateTotals(
    materials,
    parseFloat(laborHours) || 0,
    parseFloat(laborRate) || 0,
    parseFloat(markupPercent) || 0
  );

  const addMaterial = () => setMaterials(prev => [...prev, emptyMaterial()]);

  const removeMaterial = (i: number) =>
    setMaterials(prev => prev.filter((_, idx) => idx !== i));

  const updateMaterial = useCallback((i: number, field: keyof Material, value: string) => {
    setMaterials(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      if (field === 'name') return { ...m, name: value };
      return { ...m, [field]: parseFloat(value) || 0 };
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { setError('Client name is required.'); return; }
    if (!serviceType) { setError('Service type is required.'); return; }

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
      notes: notes.trim(),
      status,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/quotes/${initialData!.id}` : '/api/quotes',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      router.push(`/quotes/${saved.id}`);
    } catch {
      setError('Failed to save quote. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2e] focus:border-transparent bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Client Information */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#1a5c2e] text-white rounded text-xs font-bold flex items-center justify-center">1</span>
          Client Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Name <span className="text-red-500">*</span></label>
            <input className={inputClass} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Smith" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(843) 555-0000" type="tel" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Charleston, SC 29401" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com" type="email" />
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#1a5c2e] text-white rounded text-xs font-bold flex items-center justify-center">2</span>
          Service Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Service Type <span className="text-red-500">*</span></label>
            <select className={inputClass} value={serviceType} onChange={e => setServiceType(e.target.value)}>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Square Footage</label>
            <input
              className={inputClass} type="number" min="0" step="0.01"
              value={squareFootage} onChange={e => setSquareFootage(e.target.value)}
              placeholder="e.g. 1200"
            />
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#1a5c2e] text-white rounded text-xs font-bold flex items-center justify-center">3</span>
          Materials
        </h2>

        <div className="space-y-3">
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-1">
            <span className="col-span-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Material / Description</span>
            <span className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</span>
            <span className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Cost</span>
            <span className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Total</span>
          </div>

          {materials.map((mat, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  className={inputClass} placeholder="Material name"
                  value={mat.name} onChange={e => updateMaterial(i, 'name', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <input
                  className={inputClass} type="number" min="0" step="0.01" placeholder="1"
                  value={mat.quantity || ''} onChange={e => updateMaterial(i, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    className={`${inputClass} pl-7`} type="number" min="0" step="0.01" placeholder="0.00"
                    value={mat.unit_cost || ''} onChange={e => updateMaterial(i, 'unit_cost', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-1 text-right text-sm font-medium text-gray-700 truncate">
                {formatCurrency(mat.quantity * mat.unit_cost)}
              </div>
              <div className="col-span-1 text-right">
                <button
                  type="button" onClick={() => removeMaterial(i)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none font-bold px-1"
                  disabled={materials.length === 1}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button" onClick={addMaterial}
          className="mt-3 flex items-center gap-2 text-sm text-[#1a5c2e] font-medium hover:underline"
        >
          <span className="text-lg leading-none">+</span> Add Material
        </button>

        <div className="mt-3 pt-3 border-t border-gray-100 text-right text-sm">
          <span className="text-gray-500">Materials Total: </span>
          <span className="font-semibold text-gray-800">{formatCurrency(totals.materials_total)}</span>
        </div>
      </section>

      {/* Labor & Pricing */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#1a5c2e] text-white rounded text-xs font-bold flex items-center justify-center">4</span>
          Labor & Pricing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className={labelClass}>Labor Hours</label>
            <input
              className={inputClass} type="number" min="0" step="0.5"
              value={laborHours} onChange={e => setLaborHours(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Labor Rate ($/hr)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                className={`${inputClass} pl-7`} type="number" min="0" step="1"
                value={laborRate} onChange={e => setLaborRate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Markup %</label>
            <div className="relative">
              <input
                className={`${inputClass} pr-7`} type="number" min="0" max="200" step="0.5"
                value={markupPercent} onChange={e => setMarkupPercent(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Materials Total</span>
            <span className="font-medium">{formatCurrency(totals.materials_total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Labor Total ({laborHours || 0} hrs × {formatCurrency(parseFloat(laborRate) || 0)}/hr)</span>
            <span className="font-medium">{formatCurrency(totals.labor_total)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Markup ({markupPercent || 0}%)</span>
            <span className="font-medium">{formatCurrency(totals.markup_amount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t-2 border-[#1a5c2e] pt-2 mt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-[#1a5c2e] text-lg">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </section>

      {/* Notes & Status */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#1a5c2e] text-white rounded text-xs font-bold flex items-center justify-center">5</span>
          Notes & Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes / Scope of Work</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Additional details about the project scope, timeline, materials specs..."
            />
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
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button" onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={saving}
          className="px-6 py-2.5 bg-[#1a5c2e] hover:bg-[#134524] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Quote'}
        </button>
      </div>
    </form>
  );
}
