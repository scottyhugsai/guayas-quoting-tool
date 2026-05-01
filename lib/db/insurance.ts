import { getPool, ensureInit } from '../db';

export interface InsuranceClaim {
  id: number;
  job_id: number;
  claim_number: string;
  insurance_company: string;
  adjuster_name: string;
  adjuster_phone: string;
  adjuster_email: string;
  scope_of_loss: string;
  acv_amount: number;
  rcv_amount: number;
  deductible: number;
  status: 'pending' | 'approved' | 'denied' | 'supplement_submitted' | 'closed';
  created_at: string;
  updated_at: string;
  job_title?: string;
  client_name?: string;
}

export interface Supplement {
  id: number;
  claim_id: number;
  description: string;
  amount: number;
  status: 'submitted' | 'approved' | 'denied' | 'negotiating';
  submitted_at: string;
  resolved_at: string | null;
  notes: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToClaim(r: any): InsuranceClaim {
  const ts = (v: unknown) => v instanceof Date ? v.toISOString() : String(v ?? '');
  return {
    ...r, id: Number(r.id), job_id: Number(r.job_id),
    acv_amount: Number(r.acv_amount ?? 0),
    rcv_amount: Number(r.rcv_amount ?? 0),
    deductible: Number(r.deductible ?? 0),
    created_at: ts(r.created_at), updated_at: ts(r.updated_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSupp(r: any): Supplement {
  return {
    ...r, id: Number(r.id), claim_id: Number(r.claim_id), amount: Number(r.amount ?? 0),
    submitted_at: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : String(r.submitted_at),
    resolved_at: r.resolved_at ? (r.resolved_at instanceof Date ? r.resolved_at.toISOString() : String(r.resolved_at)) : null,
  };
}

export async function getAllClaims(): Promise<InsuranceClaim[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT ic.*, j.title AS job_title, c.name AS client_name
     FROM insurance_claims ic
     LEFT JOIN jobs j ON ic.job_id = j.id
     LEFT JOIN clients c ON j.client_id = c.id
     ORDER BY ic.created_at DESC`
  );
  return rows.map(rowToClaim);
}

export async function getClaimById(id: number): Promise<InsuranceClaim | null> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT ic.*, j.title AS job_title, c.name AS client_name
     FROM insurance_claims ic
     LEFT JOIN jobs j ON ic.job_id = j.id
     LEFT JOIN clients c ON j.client_id = c.id
     WHERE ic.id = $1`, [id]
  );
  return rows[0] ? rowToClaim(rows[0]) : null;
}

export async function getClaimsByJob(jobId: number): Promise<InsuranceClaim[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    'SELECT * FROM insurance_claims WHERE job_id = $1 ORDER BY created_at DESC', [jobId]
  );
  return rows.map(rowToClaim);
}

export type CreateClaimInput = Omit<InsuranceClaim, 'id' | 'created_at' | 'updated_at' | 'job_title' | 'client_name'>;

export async function createClaim(data: CreateClaimInput): Promise<InsuranceClaim> {
  await ensureInit();
  const { rows } = await getPool().query(
    `INSERT INTO insurance_claims
     (job_id, claim_number, insurance_company, adjuster_name, adjuster_phone,
      adjuster_email, scope_of_loss, acv_amount, rcv_amount, deductible, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [data.job_id, data.claim_number||'', data.insurance_company||'',
     data.adjuster_name||'', data.adjuster_phone||'', data.adjuster_email||'',
     data.scope_of_loss||'', data.acv_amount||0, data.rcv_amount||0, data.deductible||0,
     data.status||'pending']
  );
  return rowToClaim(rows[0]);
}

export async function updateClaim(id: number, data: Partial<CreateClaimInput>): Promise<InsuranceClaim | null> {
  await ensureInit();
  const fields = ['claim_number','insurance_company','adjuster_name','adjuster_phone',
    'adjuster_email','scope_of_loss','acv_amount','rcv_amount','deductible','status'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (!sets.length) return getClaimById(id);
  vals.push(id);
  const { rows } = await getPool().query(
    `UPDATE insurance_claims SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return rows[0] ? rowToClaim(rows[0]) : null;
}

export async function getSupplementsByClaim(claimId: number): Promise<Supplement[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    'SELECT * FROM supplements WHERE claim_id = $1 ORDER BY submitted_at DESC', [claimId]
  );
  return rows.map(rowToSupp);
}

export async function createSupplement(data: Omit<Supplement, 'id' | 'submitted_at'>): Promise<Supplement> {
  await ensureInit();
  const { rows } = await getPool().query(
    `INSERT INTO supplements (claim_id, description, amount, status, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.claim_id, data.description, data.amount||0, data.status||'submitted', data.notes||'']
  );
  return rowToSupp(rows[0]);
}

export async function updateSupplement(id: number, data: Partial<Supplement>): Promise<Supplement | null> {
  await ensureInit();
  const fields = ['description','amount','status','notes','resolved_at'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (!sets.length) return null;
  vals.push(id);
  const { rows } = await getPool().query(
    `UPDATE supplements SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals
  );
  return rows[0] ? rowToSupp(rows[0]) : null;
}

export async function deleteSupplement(id: number): Promise<void> {
  await ensureInit();
  await getPool().query('DELETE FROM supplements WHERE id = $1', [id]);
}
