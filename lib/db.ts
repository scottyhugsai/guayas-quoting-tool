import { Pool } from '@neondatabase/serverless';

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _pool = new Pool({ connectionString: url });
  }
  return _pool;
}

const INIT_SQL = `
  -- ── Core (original) ─────────────────────────────────────────────────────
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

  -- ── CRM ─────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    city TEXT DEFAULT 'Charleston',
    state TEXT DEFAULT 'SC',
    zip TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    lead_source TEXT DEFAULT 'unknown',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- ── Jobs / Pipeline ──────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    service_type TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'lead',
    description TEXT DEFAULT '',
    lead_source TEXT DEFAULT '',
    win_loss_reason TEXT DEFAULT '',
    job_value REAL DEFAULT 0,
    square_footage REAL,
    assigned_crew TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- ── Proposals (Good / Better / Best) ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    proposal_number TEXT UNIQUE NOT NULL,
    title TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',
    notes TEXT DEFAULT '',
    client_signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS proposal_tiers (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    materials JSONB NOT NULL DEFAULT '[]',
    labor_hours REAL DEFAULT 0,
    labor_rate REAL DEFAULT 75,
    markup_percent REAL DEFAULT 20,
    tax_rate REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'none',
    discount_value REAL DEFAULT 0,
    materials_total REAL DEFAULT 0,
    labor_total REAL DEFAULT 0,
    subtotal REAL DEFAULT 0,
    markup_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    is_selected BOOLEAN DEFAULT FALSE
  );

  -- ── Invoices ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'draft',
    amount REAL NOT NULL DEFAULT 0,
    due_date DATE,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method TEXT DEFAULT '',
    payment_notes TEXT DEFAULT '',
    reminder_7_sent BOOLEAN DEFAULT FALSE,
    reminder_14_sent BOOLEAN DEFAULT FALSE,
    reminder_30_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- ── Job Photos ───────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS job_photos (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    url TEXT DEFAULT '',
    caption TEXT DEFAULT '',
    photo_type TEXT DEFAULT 'general',
    ai_analysis TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- ── Insurance ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS insurance_claims (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    claim_number TEXT DEFAULT '',
    insurance_company TEXT DEFAULT '',
    adjuster_name TEXT DEFAULT '',
    adjuster_phone TEXT DEFAULT '',
    adjuster_email TEXT DEFAULT '',
    scope_of_loss TEXT DEFAULT '',
    acv_amount REAL DEFAULT 0,
    rcv_amount REAL DEFAULT 0,
    deductible REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS supplements (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES insurance_claims(id) ON DELETE CASCADE,
    description TEXT NOT NULL DEFAULT '',
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    notes TEXT DEFAULT ''
  );

  -- ── Calendar ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    event_type TEXT DEFAULT 'work',
    assigned_crew TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- ── Migrate quotes table ─────────────────────────────────────────────────
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_rate REAL DEFAULT 0;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_amount REAL DEFAULT 0;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none';
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_value REAL DEFAULT 0;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_amount REAL DEFAULT 0;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS grand_total REAL DEFAULT 0;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tier TEXT;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL;

  -- ── Default settings ─────────────────────────────────────────────────────
  INSERT INTO settings (key, value) VALUES
    ('markup_percent','20'), ('labor_rate','75'),
    ('company_name','Guayas Roofing & Construction'),
    ('company_address','Charleston, SC 29401'),
    ('company_phone','(843) 555-0100'),
    ('company_email','info@guayasroofing.com'),
    ('company_license','SC License #RBP-12345'),
    ('quote_validity_days','30'),
    ('payment_terms','Net 30 — 50% deposit required to begin work'),
    ('markup_Roofing','20'), ('markup_Siding','20'),
    ('markup_Framing','20'), ('markup_Fencing','15'),
    ('markup_Bathroom Remodel','25'), ('markup_Demolition','15'),
    ('markup_Dumpster','30'), ('tax_rate_default','0'),
    ('labor_rate_Roofing','85'), ('labor_rate_Siding','75'),
    ('labor_rate_Framing','80'), ('labor_rate_Fencing','65'),
    ('labor_rate_Bathroom Remodel','90'), ('labor_rate_Demolition','70'),
    ('labor_rate_Dumpster','60')
  ON CONFLICT (key) DO NOTHING;
`;

let _init: Promise<void> | null = null;
export async function ensureInit(): Promise<void> {
  if (!_init) _init = getPool().query(INIT_SQL).then(() => undefined);
  await _init;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Material {
  name: string;
  quantity: number;
  unit_cost: number;
  unit?: string;
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
  // Extended fields
  job_id: number | null;
  client_id: number | null;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'none' | 'percent' | 'flat';
  discount_value: number;
  discount_amount: number;
  grand_total: number;
  tier: string | null;
  proposal_id: number | null;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQuote(row: any): Quote {
  return {
    ...row,
    id: Number(row.id),
    materials: Array.isArray(row.materials) ? row.materials : JSON.parse(row.materials || '[]'),
    labor_hours: Number(row.labor_hours ?? 0),
    labor_rate: Number(row.labor_rate ?? 75),
    markup_percent: Number(row.markup_percent ?? 20),
    square_footage: row.square_footage != null ? Number(row.square_footage) : null,
    materials_total: Number(row.materials_total ?? 0),
    labor_total: Number(row.labor_total ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    markup_amount: Number(row.markup_amount ?? 0),
    total: Number(row.total ?? 0),
    job_id: row.job_id != null ? Number(row.job_id) : null,
    client_id: row.client_id != null ? Number(row.client_id) : null,
    tax_rate: Number(row.tax_rate ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    discount_type: row.discount_type ?? 'none',
    discount_value: Number(row.discount_value ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    grand_total: Number(row.grand_total ?? row.total ?? 0),
    tier: row.tier ?? null,
    proposal_id: row.proposal_id != null ? Number(row.proposal_id) : null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function generateQuoteNumber(): string {
  const n = new Date();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `GRC-${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}-${rand}`;
}

export function generateInvoiceNumber(): string {
  const n = new Date();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}-${rand}`;
}

export function generateProposalNumber(): string {
  const n = new Date();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PRO-${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}-${rand}`;
}

// ─── Quote CRUD (original, preserved) ─────────────────────────────────────

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
      notes, status, materials_total, labor_total, subtotal, markup_amount, total,
      job_id, client_id, tax_rate, tax_amount, discount_type, discount_value,
      discount_amount, grand_total, tier, proposal_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
              $19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
    RETURNING *`,
    [
      quote_number, data.client_name, data.address, data.phone, data.email,
      data.service_type, data.square_footage ?? null, JSON.stringify(data.materials),
      data.labor_hours, data.labor_rate, data.markup_percent, data.notes, data.status,
      data.materials_total, data.labor_total, data.subtotal, data.markup_amount, data.total,
      data.job_id ?? null, data.client_id ?? null,
      data.tax_rate ?? 0, data.tax_amount ?? 0,
      data.discount_type ?? 'none', data.discount_value ?? 0,
      data.discount_amount ?? 0, data.grand_total ?? data.total,
      data.tier ?? null, data.proposal_id ?? null,
    ]
  );
  return rowToQuote(rows[0]);
}

export type UpdateQuoteInput = Partial<Omit<Quote, 'id' | 'quote_number' | 'created_at'>>;

export async function updateQuote(id: number, data: UpdateQuoteInput): Promise<Quote | null> {
  await ensureInit();
  const fields = [
    'client_name','address','phone','email','service_type','square_footage',
    'labor_hours','labor_rate','markup_percent','notes','status',
    'materials_total','labor_total','subtotal','markup_amount','total',
    'job_id','client_id','tax_rate','tax_amount','discount_type',
    'discount_value','discount_amount','grand_total','tier','proposal_id',
  ] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (data.materials !== undefined) { vals.push(JSON.stringify(data.materials)); sets.push(`materials = $${vals.length}`); }
  if (!sets.length) return getQuoteById(id);
  vals.push(id);
  const { rows } = await getPool().query(
    `UPDATE quotes SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return rows[0] ? rowToQuote(rows[0]) : null;
}

export async function deleteQuote(id: number): Promise<void> {
  await ensureInit();
  await getPool().query('DELETE FROM quotes WHERE id = $1', [id]);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Record<string, string>> {
  await ensureInit();
  const { rows } = await getPool().query('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map(r => [r.key as string, r.value as string]));
}

export async function updateSettings(updates: Record<string, string>): Promise<void> {
  await ensureInit();
  for (const [k, v] of Object.entries(updates)) {
    await getPool().query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [k, v]
    );
  }
}
