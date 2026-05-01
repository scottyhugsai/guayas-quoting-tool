'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, INVOICE_STATUS_COLORS } from '@/lib/calculations';
import type { Invoice } from '@/lib/db/invoices';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(setInvoices).finally(() => setLoading(false));
  }, []);

  const totals = {
    draft: invoices.filter(i => i.status === 'draft').reduce((s, i) => s + i.amount, 0),
    sent: invoices.filter(i => i.status === 'sent' || i.status === 'viewed').reduce((s, i) => s + i.amount, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Invoices</h1>
          <p className="text-slate-400 text-sm">{invoices.length} total</p>
        </div>
        <Link href="/invoices/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Draft', value: totals.draft, color: 'text-slate-300' },
          { label: 'Outstanding', value: totals.sent, color: 'text-blue-300' },
          { label: 'Collected', value: totals.paid, color: 'text-emerald-300' },
          { label: 'Overdue', value: totals.overdue, color: 'text-red-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="text-slate-400 text-xs uppercase tracking-wider">{label}</div>
            <div className={`text-xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="text-slate-400 animate-pulse">Loading...</div> : invoices.length === 0 ? (
        <div className="text-slate-500 text-center py-16">No invoices yet</div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <Link key={inv.id} href={`/invoices/${inv.id}`}
              className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl px-5 py-4 transition-colors">
              <div>
                <div className="text-slate-200 font-medium">{inv.invoice_number}</div>
                <div className="text-slate-400 text-sm mt-0.5">{inv.client_name || inv.job_title || '—'}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-amber-400 font-semibold">{formatCurrency(inv.amount)}</div>
                  {inv.due_date && <div className="text-slate-500 text-xs">Due {inv.due_date}</div>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${INVOICE_STATUS_COLORS[inv.status]}`}>
                  {inv.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
