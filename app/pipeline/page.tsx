'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';
import type { Job, JobStage } from '@/lib/db/jobs';
import { JOB_STAGES } from '@/lib/db/jobs';

function JobCard({ job, overlay = false }: { job: Job; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={overlay ? undefined : setNodeRef} style={overlay ? undefined : style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className={`bg-slate-900 border ${isDragging ? 'border-amber-500/60' : 'border-slate-700'} rounded-lg p-3 cursor-grab active:cursor-grabbing`}>
      <div className="text-slate-200 text-sm font-medium truncate">{job.title}</div>
      {job.client_name && <div className="text-slate-500 text-xs mt-0.5 truncate">{job.client_name}</div>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-amber-400 text-xs font-semibold">{formatCurrency(job.job_value)}</span>
        <span className="text-slate-500 text-xs">{job.service_type}</span>
      </div>
    </div>
  );
}

function Column({ stage, jobs }: { stage: typeof JOB_STAGES[number]; jobs: Job[] }) {
  const total = jobs.reduce((s, j) => s + j.job_value, 0);
  return (
    <div className="flex-1 min-w-52 max-w-72">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
          <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
          <span className="text-slate-600 text-xs">{jobs.length}</span>
        </div>
        {total > 0 && <span className="text-slate-500 text-xs">{formatCurrency(total)}</span>}
      </div>
      <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
        <div className="bg-slate-800/50 rounded-xl p-2 space-y-2 min-h-24 border border-slate-800">
          {jobs.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PipelinePage() {
  const [jobsByStage, setJobsByStage] = useState<Record<string, Job[]>>({});
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadJobs = useCallback(() => {
    fetch('/api/jobs').then(r => r.json()).then((jobs: Job[]) => {
      const map: Record<string, Job[]> = {};
      for (const s of JOB_STAGES) map[s.id] = [];
      for (const j of jobs) {
        if (map[j.stage]) map[j.stage].push(j);
        else map['lead'].push(j);
      }
      setJobsByStage(map);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  function findStage(jobId: number): string {
    for (const [stage, jobs] of Object.entries(jobsByStage)) {
      if (jobs.some(j => j.id === jobId)) return stage;
    }
    return 'lead';
  }

  function onDragStart(e: DragStartEvent) {
    const job = Object.values(jobsByStage).flat().find(j => j.id === e.active.id);
    setActiveJob(job || null);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveJob(null);
    if (!over || active.id === over.id) return;

    const fromStage = findStage(Number(active.id));
    const toStage = findStage(Number(over.id)) || (JOB_STAGES.find(s => s.id === over.id)?.id);

    if (!toStage || fromStage === toStage) return;

    const job = jobsByStage[fromStage]?.find(j => j.id === active.id);
    if (!job) return;

    setJobsByStage(prev => {
      const next = { ...prev };
      next[fromStage] = next[fromStage].filter(j => j.id !== active.id);
      next[toStage] = [{ ...job, stage: toStage as JobStage }, ...(next[toStage] || [])];
      return next;
    });

    await fetch(`/api/jobs/${active.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: toStage }),
    });
  }

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Loading pipeline...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline</h1>
          <p className="text-slate-400 text-sm">Drag jobs between stages</p>
        </div>
        <Link href="/jobs/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          + New Job
        </Link>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {JOB_STAGES.map(stage => (
            <Column key={stage.id} stage={stage} jobs={jobsByStage[stage.id] || []} />
          ))}
        </div>
        <DragOverlay>
          {activeJob && <JobCard job={activeJob} overlay />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
