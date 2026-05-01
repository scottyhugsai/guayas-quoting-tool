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
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setValues(v => ({ ...v, ...data })))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2e] focus:border-transparent bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">Loading settings…</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure company information and default quote values.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="space-y-4">
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
                <input className={inputClass} type="email" value={values.company_email} onChange={set('company_email')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>License Number</label>
              <input className={inputClass} value={values.company_license} onChange={set('company_license')} />
            </div>
          </div>
        </section>

        {/* Quote Defaults */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quote Defaults</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelClass}>Default Markup %</label>
              <div className="relative">
                <input
                  className={`${inputClass} pr-7`} type="number" min="0" max="200" step="0.5"
                  value={values.markup_percent} onChange={set('markup_percent')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Default Labor Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  className={`${inputClass} pl-7`} type="number" min="0" step="1"
                  value={values.labor_rate} onChange={set('labor_rate')}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Quote Valid (days)</label>
              <input
                className={inputClass} type="number" min="1" step="1"
                value={values.quote_validity_days} onChange={set('quote_validity_days')}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Payment Terms</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={values.payment_terms} onChange={set('payment_terms')}
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Settings saved</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1a5c2e] hover:bg-[#134524] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
