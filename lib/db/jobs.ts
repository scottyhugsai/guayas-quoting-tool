import { getPool, ensureInit } from '../db';

export type JobStage =
  | 'lead' | 'quote_sent' | 'negotiating' | 'won'
  | 'in_production' | 'complete' | 'invoiced' | 'paid';

export const JOB_STAGES: { id: JobStage; label: string; color: string }[] = [
  { id: 'lead',          label: 'Lead',          color: 'text-slate-400' },
  { id: 'quote_sent',    label: 'Quote Sent',    color: 'text-blue-400' },
  { id: 'negotiating',   label: 'Negotiating',   color: 'text-yellow-400' },
  { id: 'won',           label: 'Won',           color: 'text-emerald-400' },
  { id: 'in_production', label: 'In Production', color: 'text-amber-400' },
  { id: 'complete',      label: 'Complete',      color: 'text-green-400' },
  { id: 'invoiced',      label: 'Invoiced',      color: 'text-purple-400' },
  { id: 'paid',          label: 'Paid',          color: 'text-green-500' },
];

export interface Job {
  id: number;
  client_id: number | null;
  title: string;
  service_type: string;
  stage: JobStage;
  description: string;
  lead_source: string;
  win_loss_reason: string;
  job_value: number;
  square_footage: number | null;
  assigned_crew: string;
  start_date: string | null;
  end_date: string | null;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  client_name?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToJob(row: any): Job {
  return {
    ...row,
    id: Number(row.id),
    client_id: row.client_id != null ? Number(row.client_id) : null,
    job_value: Number(row.job_value ?? 0),
    square_footage: row.square_footage != null ? Number(row.square_footage) : null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    start_date: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : row.start_date ?? null,
    end_date: row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0] : row.end_date ?? null,
  };
}

export async function getAllJobs(): Promise<Job[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT j.*, c.name AS client_name
     FROM jobs j LEFT JOIN clients c ON j.client_id = c.id
     ORDER BY j.created_at DESC`
  );
  return rows.map(rowToJob);
}

export async function getJobsByStage(): Promise<Record<JobStage, Job[]>> {
  const jobs = await getAllJobs();
  const map = {} as Record<JobStage, Job[]>;
  for (const s of JOB_STAGES) map[s.id] = [];
  for (const j of jobs) {
    if (map[j.stage]) map[j.stage].push(j); else map['lead'].push(j);
  }
  return map;
}

export async function getJobById(id: number): Promise<Job | null> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT j.*, c.name AS client_name
     FROM jobs j LEFT JOIN clients c ON j.client_id = c.id
     WHERE j.id = $1`, [id]
  );
  return rows[0] ? rowToJob(rows[0]) : null;
}

export type CreateJobInput = Omit<Job, 'id' | 'created_at' | 'updated_at' | 'client_name'>;

export async function createJob(data: CreateJobInput): Promise<Job> {
  await ensureInit();
  const { rows } = await getPool().query(
    `INSERT INTO jobs (client_id, title, service_type, stage, description, lead_source,
      win_loss_reason, job_value, square_footage, assigned_crew, start_date, end_date, address, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [data.client_id ?? null, data.title, data.service_type, data.stage||'lead',
     data.description||'', data.lead_source||'', data.win_loss_reason||'',
     data.job_value||0, data.square_footage??null, data.assigned_crew||'',
     data.start_date||null, data.end_date||null, data.address||'', data.notes||'']
  );
  return rowToJob(rows[0]);
}

export async function updateJob(id: number, data: Partial<CreateJobInput>): Promise<Job | null> {
  await ensureInit();
  const fields = ['client_id','title','service_type','stage','description','lead_source',
    'win_loss_reason','job_value','square_footage','assigned_crew','start_date','end_date','address','notes'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (!sets.length) return getJobById(id);
  vals.push(id);
  const { rows } = await getPool().query(
    `UPDATE jobs SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return rows[0] ? rowToJob(rows[0]) : null;
}

export async function updateJobStage(id: number, stage: JobStage): Promise<Job | null> {
  await ensureInit();
  const { rows } = await getPool().query(
    'UPDATE jobs SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [stage, id]
  );
  return rows[0] ? rowToJob(rows[0]) : null;
}

export async function deleteJob(id: number): Promise<void> {
  await ensureInit();
  await getPool().query('DELETE FROM jobs WHERE id = $1', [id]);
}

export interface JobPhoto {
  id: number;
  job_id: number;
  url: string;
  caption: string;
  photo_type: string;
  ai_analysis: string;
  created_at: string;
}

export async function getPhotosByJob(jobId: number): Promise<JobPhoto[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    'SELECT * FROM job_photos WHERE job_id = $1 ORDER BY created_at DESC', [jobId]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    ...r, id: Number(r.id), job_id: Number(r.job_id),
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}

export async function createPhoto(data: Omit<JobPhoto, 'id' | 'created_at'>): Promise<JobPhoto> {
  await ensureInit();
  const { rows } = await getPool().query(
    `INSERT INTO job_photos (job_id, url, caption, photo_type, ai_analysis)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.job_id, data.url||'', data.caption||'', data.photo_type||'general', data.ai_analysis||'']
  );
  const r = rows[0];
  return { ...r, id: Number(r.id), job_id: Number(r.job_id),
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at) };
}

export async function updatePhotoAnalysis(id: number, ai_analysis: string): Promise<void> {
  await ensureInit();
  await getPool().query('UPDATE job_photos SET ai_analysis = $1 WHERE id = $2', [ai_analysis, id]);
}
