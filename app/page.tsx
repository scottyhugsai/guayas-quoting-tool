'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/calculations';
import Link from 'next/link';

interface DashboardData {
  pipeline_value: number;
  total_jobs: number;
  open_quotes: number;
  total_invoiced: number;
  total_paid: number;
  open_claims: number;
  monthly_revenue: { month: string; revenue: number }[];
  jobs_by_stage: Record<string, number>;
}

function StatCard({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-amber-500/40 transition-colors">
      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 animate-pulse">Loading dashboard...</div>
    </div>
  );

  if (!data) return <div className="p-8 text-red-400">Failed to load dashboard</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Guayas Roofing & Construction — Charleston, SC</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Pipeline Value" value={formatCurrency(data.pipeline_value)} sub="active jobs" href="/pipeline" />
        <StatCard label="Total Jobs" value={String(data.total_jobs)} href="/jobs" />
        <StatCard label="Open Quotes" value={String(data.open_quotes)} href="/quotes" />
        <StatCard label="Invoiced" value={formatCurrency(data.total_invoiced)} sub="total sent" href="/invoices" />
        <StatCard label="Collected" value={formatCurrency(data.total_paid)} sub="paid invoices" href="/invoices" />
        <StatCard label="Open Claims" value={String(data.open_claims)} href="/insurance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-slate-200 font-semibold mb-4">Revenue (Last 12 Months)</h2>
          {data.monthly_revenue.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No paid invoices yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthly_revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-slate-200 font-semibold mb-4">Pipeline Stages</h2>
          <div className="space-y-2">
            {[
              { key: 'lead', label: 'Lead', color: 'bg-slate-500' },
              { key: 'quote_sent', label: 'Quote Sent', color: 'bg-blue-500' },
              { key: 'negotiating', label: 'Negotiating', color: 'bg-yellow-500' },
              { key: 'won', label: 'Won', color: 'bg-emerald-500' },
              { key: 'in_production', label: 'In Production', color: 'bg-amber-500' },
              { key: 'complete', label: 'Complete', color: 'bg-green-500' },
              { key: 'invoiced', label: 'Invoiced', color: 'bg-purple-500' },
              { key: 'paid', label: 'Paid', color: 'bg-green-600' },
            ].map(({ key, label, color }) => {
              const count = data.jobs_by_stage[key] || 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                  <span className="text-slate-300 text-sm flex-1">{label}</span>
                  <span className="text-slate-400 text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/clients/new" className="flex items-center gap-3 bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl p-4 transition-colors">
          <span className="text-2xl">👤</span>
          <div>
            <div className="text-slate-200 font-medium text-sm">New Client</div>
            <div className="text-slate-500 text-xs">Add to CRM</div>
          </div>
        </Link>
        <Link href="/quotes/new" className="flex items-center gap-3 bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl p-4 transition-colors">
          <span className="text-2xl">📋</span>
          <div>
            <div className="text-slate-200 font-medium text-sm">New Quote</div>
            <div className="text-slate-500 text-xs">Create estimate</div>
          </div>
        </Link>
        <Link href="/jobs/new" className="flex items-center gap-3 bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl p-4 transition-colors">
          <span className="text-2xl">🔨</span>
          <div>
            <div className="text-slate-200 font-medium text-sm">New Job</div>
            <div className="text-slate-500 text-xs">Start a project</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
