'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Quote } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/calculations';
import StatusBadge from '@/components/StatusBadge';

export default function QuoteViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${id}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([q, s]) => {
      setQuote(q);
      setSettings(s);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: Quote['status']) => {
    if (!quote) return;
    setUpdatingStatus(true);
    const res = await fetch(`/api/quotes/${quote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setQuote(await res.json());
    setUpdatingStatus(false);
  };

  const handleGeneratePDF = async () => {
    if (!quote) return;
    setGeneratingPdf(true);
    try {
      const { generateQuotePDF } = await import('@/lib/pdf');
      await generateQuotePDF(quote, {
        company_name: settings.company_name ?? 'Guayas Roofing & Construction',
        company_address: settings.company_address ?? 'Charleston, SC',
        company_phone: settings.company_phone ?? '',
        company_email: settings.company_email ?? '',
        company_license: settings.company_license ?? '',
        quote_validity_days: settings.quote_validity_days ?? '30',
        payment_terms: settings.payment_terms ?? '',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!quote || !confirm('Delete this quote? This cannot be undone.')) return;
    await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
    router.push('/');
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-400 text-sm">Loading quote…</div>;
  }
  if (!quote) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 mb-4">Quote not found.</p>
        <Link href="/" className="text-[#1a5c2e] hover:underline text-sm">← Back to dashboard</Link>
      </div>
    );
  }

  const STATUS_ACTIONS: { status: Quote['status']; label: string; className: string }[] = [
    { status: 'draft', label: 'Mark Draft', className: 'border border-gray-300 text-gray-700 hover:bg-gray-50' },
    { status: 'sent', label: 'Mark Sent', className: 'border border-blue-300 text-blue-700 hover:bg-blue-50' },
    { status: 'accepted', label: 'Mark Accepted', className: 'border border-green-400 text-green-700 hover:bg-green-50' },
    { status: 'rejected', label: 'Mark Rejected', className: 'border border-red-300 text-red-500 hover:bg-red-50' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← All Quotes</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{quote.quote_number}</h1>
          <p className="text-sm text-gray-500">Created {formatDate(quote.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_ACTIONS.filter(a => a.status !== quote.status).map(a => (
            <button
              key={a.status}
              onClick={() => handleStatusChange(a.status)}
              disabled={updatingStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${a.className}`}
            >
              {a.label}
            </button>
          ))}
          <button
            onClick={handleGeneratePDF}
            disabled={generatingPdf}
            className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {generatingPdf ? 'Generating…' : '⬇ Download PDF'}
          </button>
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="px-4 py-2 bg-[#1a5c2e] hover:bg-[#134524] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl border px-5 py-3 flex items-center justify-between ${
        quote.status === 'accepted' ? 'bg-green-50 border-green-200' :
        quote.status === 'rejected' ? 'bg-red-50 border-red-200' :
        quote.status === 'sent' ? 'bg-blue-50 border-blue-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <StatusBadge status={quote.status} />
          <span className="text-sm text-gray-600">
            {quote.status === 'draft' && 'This quote is a draft — not yet sent to the client.'}
            {quote.status === 'sent' && 'This quote has been sent to the client.'}
            {quote.status === 'accepted' && 'The client has accepted this quote.'}
            {quote.status === 'rejected' && 'The client declined this quote.'}
          </span>
        </div>
        <span className="text-xs text-gray-400">Updated {formatDate(quote.updated_at)}</span>
      </div>

      {/* Client & Project */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard title="Client">
          <InfoRow label="Name" value={quote.client_name} />
          {quote.address && <InfoRow label="Address" value={quote.address} />}
          {quote.phone && <InfoRow label="Phone" value={quote.phone} />}
          {quote.email && <InfoRow label="Email" value={quote.email} />}
        </InfoCard>
        <InfoCard title="Project">
          <InfoRow label="Service" value={quote.service_type} />
          {quote.square_footage && <InfoRow label="Sq Ft" value={quote.square_footage.toLocaleString()} />}
          <InfoRow label="Labor" value={`${quote.labor_hours} hrs @ ${formatCurrency(quote.labor_rate)}/hr`} />
          <InfoRow label="Markup" value={`${quote.markup_percent}%`} />
        </InfoCard>
      </div>

      {/* Materials */}
      {quote.materials.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800 text-sm">Materials</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quote.materials.map((m, i) => (
                <tr key={i}>
                  <td className="px-5 py-2.5 text-gray-800">{m.name}</td>
                  <td className="px-5 py-2.5 text-right text-gray-600">{m.quantity.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-right text-gray-600">{formatCurrency(m.unit_cost)}</td>
                  <td className="px-5 py-2.5 text-right font-medium text-gray-800">{formatCurrency(m.quantity * m.unit_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-4">Pricing Summary</h3>
        <div className="space-y-2 max-w-xs ml-auto">
          <PriceLine label="Materials" value={formatCurrency(quote.materials_total)} />
          <PriceLine label={`Labor (${quote.labor_hours} hrs × ${formatCurrency(quote.labor_rate)}/hr)`} value={formatCurrency(quote.labor_total)} />
          <PriceLine label="Subtotal" value={formatCurrency(quote.subtotal)} border />
          <PriceLine label={`Markup (${quote.markup_percent}%)`} value={formatCurrency(quote.markup_amount)} />
          <PriceLine label="Total" value={formatCurrency(quote.total)} bold border />
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Notes / Scope of Work</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Danger zone */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-600 hover:underline"
        >
          Delete this quote
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function PriceLine({ label, value, border = false, bold = false }: {
  label: string; value: string; border?: boolean; bold?: boolean;
}) {
  return (
    <div className={`flex justify-between text-sm ${border ? 'border-t border-gray-200 pt-2 mt-2' : ''} ${bold ? 'font-bold text-[#1a5c2e] text-base' : ''}`}>
      <span className={bold ? 'text-gray-900' : 'text-gray-600'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
