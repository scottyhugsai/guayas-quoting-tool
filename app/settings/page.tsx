'use client';
import { useEffect, useState } from 'react';

interface Settings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_license: string;
  markup_percent: string;
  labor_rate: string;
  quote_validity_days: string;
  payment_terms: string;
}

const DEFAULT: Settings = {
  company_name: 'Guayas Roofing & Construction',
  company_address: 'Charleston, SC 29401',
  company_phone: '(843) 555-0100',
  company_email: 'info@guayasroofing.com',
  company_license: 'SC License #RBP-12345',
  markup_percent: '20',
  labor_rate: '75',
  quote_validity_days: '30',
  payment_terms: 'Net 30 — 50% deposit required to begin work',
};

export default function SettingsPage() {
  const [values, setValues] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => setValues(v => ({ ...v, ...data }))).finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const inputClass = 'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60';
  const labelClass = 'block text-slate-400 text-xs font-medium mb-1';

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Loading settings...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure company information and default quote values.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Company Information</h2>
          <div>
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={values.company_name} onChange={set('company_name')} />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={values.company_address} onChange={set('company_address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={values.company_phone} onChange={set('company_phone')} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={values.company_email} onChange={set('company_email')} />
            </div>
          </div>
          <div>
            <label className={labelClass}>License Number</label>
            <input className={inputClass} value={values.company_license} onChange={set('company_license')} />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-300 font-medium text-sm uppercase tracking-wider">Quote Defaults</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Default Markup %</label>
              <input type="number" min="0" max="200" step="0.5" className={inputClass} value={values.markup_percent} onChange={set('markup_percent')} />
            </div>
            <div>
              <label className={labelClass}>Default Labor Rate ($/hr)</label>
              <input type="number" min="0" step="1" className={inputClass} value={values.labor_rate} onChange={set('labor_rate')} />
            </div>
            <div>
              <label className={labelClass}>Quote Valid (days)</label>
              <input type="number" min="1" step="1" className={inputClass} value={values.quote_validity_days} onChange={set('quote_validity_days')} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Payment Terms</label>
            <textarea className={`${inputClass} min-h-20 resize-y`} value={values.payment_terms} onChange={set('payment_terms')} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-400 font-medium">✓ Saved</span>}
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 rounded-lg text-sm font-semibold transition-colors">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
