import { getPool, ensureInit } from '../db';

export interface Client {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  lead_source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToClient(row: any): Client {
  return {
    ...row,
    id: Number(row.id),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function getAllClients(): Promise<Client[]> {
  await ensureInit();
  const { rows } = await getPool().query('SELECT * FROM clients ORDER BY name ASC');
  return rows.map(rowToClient);
}

export async function getClientById(id: number): Promise<Client | null> {
  await ensureInit();
  const { rows } = await getPool().query('SELECT * FROM clients WHERE id = $1', [id]);
  return rows[0] ? rowToClient(rows[0]) : null;
}

export async function getClientWithHistory(id: number) {
  await ensureInit();
  const [clientRes, jobsRes, quotesRes] = await Promise.all([
    getPool().query('SELECT * FROM clients WHERE id = $1', [id]),
    getPool().query('SELECT * FROM jobs WHERE client_id = $1 ORDER BY created_at DESC', [id]),
    getPool().query('SELECT * FROM quotes WHERE client_id = $1 ORDER BY created_at DESC', [id]),
  ]);
  if (!clientRes.rows[0]) return null;
  return {
    client: rowToClient(clientRes.rows[0]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jobs: jobsRes.rows.map((r: any) => ({ ...r, id: Number(r.id), job_value: Number(r.job_value ?? 0) })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quotes: quotesRes.rows.map((r: any) => ({ ...r, id: Number(r.id), total: Number(r.total ?? 0) })),
  };
}

export type CreateClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export async function createClient(data: CreateClientInput): Promise<Client> {
  await ensureInit();
  const { rows } = await getPool().query(
    `INSERT INTO clients (name, address, city, state, zip, phone, email, lead_source, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.name, data.address||'', data.city||'Charleston', data.state||'SC',
     data.zip||'', data.phone||'', data.email||'', data.lead_source||'unknown', data.notes||'']
  );
  return rowToClient(rows[0]);
}

export async function updateClient(id: number, data: Partial<CreateClientInput>): Promise<Client | null> {
  await ensureInit();
  const fields = ['name','address','city','state','zip','phone','email','lead_source','notes'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (!sets.length) return getClientById(id);
  vals.push(id);
  const { rows } = await getPool().query(
    `UPDATE clients SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return rows[0] ? rowToClient(rows[0]) : null;
}

export async function deleteClient(id: number): Promise<void> {
  await ensureInit();
  await getPool().query('DELETE FROM clients WHERE id = $1', [id]);
}
