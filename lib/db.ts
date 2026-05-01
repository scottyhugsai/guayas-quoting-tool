import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set');
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    quote_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    service_type TEXT NOT NULL,
    square_footage REAL,
    materials JSONB NOT NULL DEFAULT '[]',
    labor_hours REAL NOT NULL DEFAULT 0,
    labor_rate REAL NOT NULL DEFAULT 75,
    markup_percent REAL NOT NULL DEFAULT 20,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    materials_total REAL NOT NULL DEFAULT 0,
    labor_total REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    markup_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT INTO settings (key, value) VALUES
    ('markup_percent', '20'),
    ('labor_rate', '75'),
    ('company_name', 'Guayas Roofing & Construction'),
    ('company_address', 'Charleston, SC 29401'),
    ('company_phone', '(843) 555-0100'),
    ('company_email', 'info@guayasroofing.com'),
    ('company_license', 'SC License #RBP-12345'),
    ('quote_validity_days', '30'),
    ('payment_terms', 'Net 30 — 50% deposit required to begin work')
  ON CONFLICT (key) DO NOTHING;
`;

let _init: Promise<void> | null = null;
async function ensureInit() {
  if (!_init) _init = getPool().query(INIT_SQL).then(() => undefined);
  await _init;
}

export interface Material {
  name: string;
  quantity: number;
  unit_cost: number;
}

export interface Quote {
  id: number;
  quote_number: string;
  client_name: string;
  address: string;
  phone: string;
  email: string;
  service_type: string;
  square_footage: number | null;
  materials: Material[];
  labor_hours: number;
  labor_rate: number;
  markup_percent: number;
  notes: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  materials_total: number;
  labor_total: number;
  subtotal: number;
  markup_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQuote(row: any): Quote {
  return {
    ...row,
    id: Number(row.id),
    materials: Array.isArray(row.materials) ? row.materials : JSON.parse(row.materials || '[]'),
    labor_hours: Number(row.labor_hours),
    labor_rate: Number(row.labor_rate),
    markup_percent: Number(row.markup_percent),
    square_footage: row.square_footage != null ? Number(row.square_footage) : null,
    materials_total: Number(row.materials_total),
    labor_total: Number(row.labor_total),
    subtotal: Number(row.subtotal),
    markup_amount: Number(row.markup_amount),
    total: Number(row.total),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function generateQuoteNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `GRC-${y}${m}${d}-${rand}`;
}

export async function getAllQuotes(): Promise<Quote[]> {
  await ensureInit();
  const { rows } = await getPool().query('SELECT * FROM quotes ORDER BY created_at DESC');
  return rows.map(rowToQuote);
}

export async function getQuoteById(id: number): Promise<Quote | null> {
  await ensureInit();
  const { rows } = await getPool().query('SELECT * FROM quotes WHERE id = $1', [id]);
  return rows[0] ? rowToQuote(rows[0]) : null;
}

export type CreateQuoteInput = Omit<Quote, 'id' | 'quote_number' | 'created_at' | 'updated_at'>;

export async function createQuote(data: CreateQuoteInput): Promise<Quote> {
  await ensureInit();
  const quote_number = generateQuoteNumber();
  const { rows } = await getPool().query(
    `INSERT INTO quotes (
      quote_number, client_name, address, phone, email, service_type,
      square_footage, materials, labor_hours, labor_rate, markup_percent,
      notes, status, materials_total, labor_total, subtotal, markup_amount, total
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *`,
    [
      quote_number, data.client_name, data.address, data.phone, data.email,
      data.service_type, data.square_footage ?? null, JSON.stringify(data.materials),
      data.labor_hours, data.labor_rate, data.markup_percent, data.notes, data.status,
      data.materials_total, data.labor_total, data.subtotal, data.markup_amount, data.total,
    ]
  );
  return rowToQuote(rows[0]);
}

export type UpdateQuoteInput = Partial<Omit<Quote, 'id' | 'quote_number' | 'created_at'>>;

export async function updateQuote(id: number, data: UpdateQuoteInput): Promise<Quote | null> {
  await ensureInit();

  const scalarFields = [
    'client_name', 'address', 'phone', 'email', 'service_type', 'square_footage',
    'labor_hours', 'labor_rate', 'markup_percent', 'notes', 'status',
    'materials_total', 'labor_total', 'subtotal', 'markup_amount', 'total',
  ] as const;

  const setClauses: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = [];

  for (const field of scalarFields) {
    if (data[field] !== undefined) {
      values.push(data[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }
  if (data.materials !== undefined) {
    values.push(JSON.stringify(data.materials));
    setClauses.push(`materials = $${values.length}`);
  }

  if (setClauses.length === 0) return getQuoteById(id);

  values.push(id);
  const { rows } = await getPool().query(
    `UPDATE quotes SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ? rowToQuote(rows[0]) : null;
}

export async function deleteQuote(id: number): Promise<void> {
  await ensureInit();
  await getPool().query('DELETE FROM quotes WHERE id = $1', [id]);
}

export async function getSettings(): Promise<Record<string, string>> {
  await ensureInit();
  const { rows } = await getPool().query('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map(r => [r.key as string, r.value as string]));
}

export async function updateSettings(updates: Record<string, string>): Promise<void> {
  await ensureInit();
  const p = getPool();
  for (const [key, value] of Object.entries(updates)) {
    await p.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
    );
  }
}
