'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';
import type { Job } from '@/lib/db/jobs';
import { JOB_STAGES } from '@/lib/db/jobs';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(setJobs).finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const matchesSearch = !filter || j.title.toLowerCase().includes(filter.toLowerCase()) ||
      (j.client_name || '').toLowerCase().includes(filter.toLowerCase());
    const matchesStage = !stageFilter || j.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Jobs</h1>
          <p className="text-slate-400 text-sm">{jobs.length} total jobs</p>
        </div>
        <Link href="/jobs/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Job
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search jobs..."
          className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60" />
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60">
          <option value="">All Stages</option>
          {JOB_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {loading ? <div className="text-slate-400 animate-pulse">Loading...</div> : filtered.length === 0 ? (
        <div className="text-slate-500 text-center py-16">No jobs found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(j => (
            <Link key={j.id} href={`/jobs/${j.id}`}
              className="flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl px-5 py-4 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-slate-200 font-medium">{j.title}</div>
                <div className="text-slate-400 text-sm mt-0.5">{j.client_name || 'No client'} · {j.service_type}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-amber-400 font-semibold">{formatCurrency(j.job_value)}</div>
                  <div className={`text-xs ${JOB_STAGES.find(s => s.id === j.stage)?.color || 'text-slate-400'}`}>
                    {JOB_STAGES.find(s => s.id === j.stage)?.label || j.stage}
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
