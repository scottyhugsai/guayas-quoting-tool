import { getPool, ensureInit, generateProposalNumber } from '../db';
import type { Material } from '../db';

export interface ProposalTier {
  id: number;
  proposal_id: number;
  tier: 'good' | 'better' | 'best';
  label: string;
  materials: Material[];
  labor_hours: number;
  labor_rate: number;
  markup_percent: number;
  tax_rate: number;
  discount_type: 'none' | 'percent' | 'flat';
  discount_value: number;
  materials_total: number;
  labor_total: number;
  subtotal: number;
  markup_amount: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  notes: string;
  is_selected: boolean;
}

export interface Proposal {
  id: number;
  job_id: number | null;
  client_id: number | null;
  proposal_number: string;
  title: string;
  status: string;
  notes: string;
  client_signed_at: string | null;
  created_at: string;
  updated_at: string;
  tiers?: ProposalTier[];
  // Joined
  client_name?: string;
  job_title?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTier(row: any): ProposalTier {
  return {
    ...row,
    id: Number(row.id),
    proposal_id: Number(row.proposal_id),
    materials: Array.isArray(row.materials) ? row.materials : JSON.parse(row.materials || '[]'),
    labor_hours: Number(row.labor_hours ?? 0),
    labor_rate: Number(row.labor_rate ?? 75),
    markup_percent: Number(row.markup_percent ?? 20),
    tax_rate: Number(row.tax_rate ?? 0),
    discount_value: Number(row.discount_value ?? 0),
    materials_total: Number(row.materials_total ?? 0),
    labor_total: Number(row.labor_total ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    markup_amount: Number(row.markup_amount ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    total: Number(row.total ?? 0),
    is_selected: Boolean(row.is_selected),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProposal(row: any): Proposal {
  return {
    ...row,
    id: Number(row.id),
    job_id: row.job_id != null ? Number(row.job_id) : null,
    client_id: row.client_id != null ? Number(row.client_id) : null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    client_signed_at: row.client_signed_at ? (row.client_signed_at instanceof Date ? row.client_signed_at.toISOString() : String(row.client_signed_at)) : null,
  };
}

export async function getAllProposals(): Promise<Proposal[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT p.*, c.name AS client_name, j.title AS job_title
     FROM proposals p
     LEFT JOIN clients c ON p.client_id = c.id
     LEFT JOIN jobs j ON p.job_id = j.id
     ORDER BY p.created_at DESC`
  );
  return rows.map(rowToProposal);
}

export async function getProposalById(id: number): Promise<Proposal | null> {
  await ensureInit();
  const [propRes, tiersRes] = await Promise.all([
    getPool().query(
      `SELECT p.*, c.name AS client_name, j.title AS job_title
       FROM proposals p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN jobs j ON p.job_id = j.id
       WHERE p.id = $1`, [id]
    ),
    getPool().query('SELECT * FROM proposal_tiers WHERE proposal_id = $1 ORDER BY tier ASC', [id]),
  ]);
  if (!propRes.rows[0]) return null;
  return { ...rowToProposal(propRes.rows[0]), tiers: tiersRes.rows.map(rowToTier) };
}

export async function getProposalsByJob(jobId: number): Promise<Proposal[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    'SELECT * FROM proposals WHERE job_id = $1 ORDER BY created_at DESC', [jobId]
  );
  return rows.map(rowToProposal);
}

export interface CreateProposalInput {
  job_id?: number | null;
  client_id?: number | null;
  title?: string;
  notes?: string;
}

export async function createProposal(data: CreateProposalInput): Promise<Proposal> {
  await ensureInit();
  const proposal_number = generateProposalNumber();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [p] } = await client.query(
      `INSERT INTO proposals (job_id, client_id, proposal_number, title, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.job_id??null, data.client_id??null, proposal_number, data.title||'', data.notes||'']
    );
    const tiers: [string, string][] = [
      ['good','Good — Standard'],
      ['better','Better — Premium'],
      ['best','Best — Elite'],
    ];
    for (const [tier, label] of tiers) {
      await client.query(
        `INSERT INTO proposal_tiers (proposal_id, tier, label) VALUES ($1,$2,$3)`,
        [p.id, tier, label]
      );
    }
    await client.query('COMMIT');
    return (await getProposalById(Number(p.id)))!;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function updateProposal(id: number, data: Partial<CreateProposalInput & { status: string }>): Promise<Proposal | null> {
  await ensureInit();
  const fields = ['job_id','client_id','title','notes','status'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (!sets.length) return getProposalById(id);
  vals.push(id);
  await getPool().query(
    `UPDATE proposals SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length}`,
    vals
  );
  return getProposalById(id);
}

export interface UpdateTierInput {
  label?: string;
  materials?: Material[];
  labor_hours?: number;
  labor_rate?: number;
  markup_percent?: number;
  tax_rate?: number;
  discount_type?: string;
  discount_value?: number;
  materials_total?: number;
  labor_total?: number;
  subtotal?: number;
  markup_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  total?: number;
  notes?: string;
  is_selected?: boolean;
}

export async function updateProposalTier(tierId: number, data: UpdateTierInput): Promise<ProposalTier | null> {
  await ensureInit();
  const fields = ['label','labor_hours','labor_rate','markup_percent','tax_rate',
    'discount_type','discount_value','materials_total','labor_total','subtotal',
    'markup_amount','discount_amount','tax_amount','total','notes','is_selected'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (data.materials !== undefined) { vals.push(JSON.stringify(data.materials)); sets.push(`materials = $${vals.length}`); }
  if (!sets.length) return null;
  vals.push(tierId);
  const { rows } = await getPool().query(
    `UPDATE proposal_tiers SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return rows[0] ? rowToTier(rows[0]) : null;
}

export async function selectProposalTier(proposalId: number, tierId: number): Promise<void> {
  await ensureInit();
  await getPool().query('UPDATE proposal_tiers SET is_selected = FALSE WHERE proposal_id = $1', [proposalId]);
  await getPool().query('UPDATE proposal_tiers SET is_selected = TRUE WHERE id = $1', [tierId]);
  await getPool().query("UPDATE proposals SET status = 'accepted', updated_at = NOW() WHERE id = $1", [proposalId]);
}
