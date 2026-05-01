'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, INVOICE_STATUS_COLORS } from '@/lib/calculations';
import type { Invoice } from '@/lib/db/invoices';

const STATUSES = ['draft', 'sent', 'viewed', 'paid', 'overdue'] as const;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(setInvoice);
  }, [id]);

  async function updateStatus(status: string) {
    setSaving(true);
    const updates: Partial<Invoice> = { status: status as Invoice['status'] };
    if (status === 'sent' && !invoice?.sent_at) updates.sent_at = new Date().toISOString();
    if (status === 'paid' && !invoice?.paid_at) updates.paid_at = new Date().toISOString();
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) setInvoice(await res.json());
    setSaving(false);
  }

  async function deleteInvoice() {
    if (!confirm('Delete this invoice?')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    router.push('/invoices');
  }

  if (!invoice) return <div className="p-6 text-slate-400 animate-pulse">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/invoices" className="text-slate-500 text-sm hover:text-slate-300">← Invoices</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{invoice.invoice_number}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${INVOICE_STATUS_COLORS[invoice.status]}`}>
              {invoice.status}
            </span>
            {invoice.client_name && <span className="text-slate-400 text-sm">{invoice.client_name}</span>}
          </div>
        </div>
        <button onClick={deleteInvoice}
          className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors">
          Delete
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Amount</span>
          <span className="text-amber-400 text-2xl font-bold">{formatCurrency(invoice.amount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Due Date</span>
          <span className="text-slate-200 text-sm">{invoice.due_date || '—'}</span>
        </div>
        {invoice.sent_at && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Sent</span>
            <span className="text-slate-200 text-sm">{new Date(invoice.sent_at).toLocaleDateString()}</span>
          </div>
        )}
        {invoice.paid_at && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Paid</span>
            <span className="text-emerald-400 text-sm font-medium">{new Date(invoice.paid_at).toLocaleDateString()}</span>
          </div>
        )}
        {invoice.payment_notes && (
          <div>
            <div className="text-slate-400 text-sm mb-1">Notes</div>
            <p className="text-slate-300 text-sm">{invoice.payment_notes}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-slate-300 font-medium text-sm mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={saving || invoice.status === s}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                invoice.status === s
                  ? `${INVOICE_STATUS_COLORS[s]} opacity-100 cursor-default`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
