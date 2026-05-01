'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';
import type { Job, JobPhoto } from '@/lib/db/jobs';
import { JOB_STAGES } from '@/lib/db/jobs';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [stage, setStage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then(r => r.json()).then(j => { setJob(j); setStage(j.stage); });
    fetch(`/api/jobs/${id}/photos`).then(r => r.json()).then(setPhotos);
  }, [id]);

  async function updateStage(newStage: string) {
    setStage(newStage);
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    setJob(j => j ? { ...j, stage: newStage as Job['stage'] } : j);
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await fetch(`/api/jobs/${id}/photos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: reader.result, caption: file.name, photo_type: 'before' }),
      });
      if (res.ok) {
        const photo = await res.json();
        setPhotos(p => [photo, ...p]);
        // Auto-analyze
        setAnalyzing(photo.id);
        const aiRes = await fetch('/api/ai/analyze-photo', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: photo.id, imageBase64: base64, mimeType: file.type, jobContext: job?.title }),
        });
        if (aiRes.ok) {
          const { analysis } = await aiRes.json();
          setPhotos(p => p.map(ph => ph.id === photo.id ? { ...ph, ai_analysis: analysis } : ph));
        }
        setAnalyzing(null);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function deleteJob() {
    if (!confirm('Delete this job?')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    router.push('/jobs');
  }

  if (!job) return <div className="p-6 text-slate-400 animate-pulse">Loading...</div>;

  const stageInfo = JOB_STAGES.find(s => s.id === job.stage);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/jobs" className="text-slate-500 text-sm hover:text-slate-300">← Jobs</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{job.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-sm font-medium ${stageInfo?.color}`}>{stageInfo?.label}</span>
            {job.client_name && <span className="text-slate-400 text-sm">· {job.client_name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <select value={stage} onChange={e => updateStage(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/60">
            {JOB_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={deleteJob}
            className="bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">Job Value</div>
          <div className="text-amber-400 text-xl font-bold mt-1">{formatCurrency(job.job_value)}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">Service</div>
          <div className="text-slate-200 font-medium mt-1">{job.service_type}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">Crew</div>
          <div className="text-slate-200 font-medium mt-1">{job.assigned_crew || '—'}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider">Dates</div>
          <div className="text-slate-200 text-sm mt-1">
            {job.start_date ? job.start_date : '—'} → {job.end_date ? job.end_date : '—'}
          </div>
        </div>
      </div>

      {job.description && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Description</h3>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold">Photos ({photos.length})</h2>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            {uploading ? 'Uploading...' : '+ Add Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        </div>
        {photos.length === 0 ? (
          <p className="text-slate-500 text-sm">No photos yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map(ph => (
              <div key={ph.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {ph.url && <img src={ph.url} alt={ph.caption} className="w-full h-48 object-cover" />}
                <div className="p-3">
                  <div className="text-slate-300 text-sm font-medium">{ph.caption}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{ph.photo_type}</div>
                  {analyzing === ph.id ? (
                    <div className="text-amber-400 text-xs mt-2 animate-pulse">Analyzing with AI...</div>
                  ) : ph.ai_analysis ? (
                    <div className="mt-2 p-2 bg-slate-900 rounded text-slate-300 text-xs">{ph.ai_analysis}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
