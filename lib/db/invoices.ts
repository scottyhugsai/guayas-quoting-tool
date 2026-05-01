import { getPool, ensureInit, generateInvoiceNumber, getQuoteById } from '../db';

export interface Invoice {
  id: number;
  job_id: number | null;
  quote_id: number | null;
  client_id: number | null;
  invoice_number: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  amount: number;
  due_date: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  payment_method: string;
  payment_notes: string;
  reminder_7_sent: boolean;
  reminder_14_sent: boolean;
  reminder_30_sent: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  client_name?: string;
  job_title?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInvoice(row: any): Invoice {
  const ts = (v: unknown) => v instanceof Date ? v.toISOString() : (v ? String(v) : null);
  const d = (v: unknown) => v instanceof Date ? v.toISOString().split('T')[0] : (v ? String(v) : null);
  return {
    ...row,
    id: Number(row.id),
    job_id: row.job_id != null ? Number(row.job_id) : null,
    quote_id: row.quote_id != null ? Number(row.quote_id) : null,
    client_id: row.client_id != null ? Number(row.client_id) : null,
    amount: Number(row.amount ?? 0),
    due_date: d(row.due_date),
    sent_at: ts(row.sent_at),
    viewed_at: ts(row.viewed_at),
    paid_at: ts(row.paid_at),
    reminder_7_sent: Boolean(row.reminder_7_sent),
    reminder_14_sent: Boolean(row.reminder_14_sent),
    reminder_30_sent: Boolean(row.reminder_30_sent),
    created_at: ts(row.created_at) ?? '',
    updated_at: ts(row.updated_at) ?? '',
  };
}

export async function getAllInvoices(): Promise<Invoice[]> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT i.*, c.name AS client_name, j.title AS job_title
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     LEFT JOIN jobs j ON i.job_id = j.id
     ORDER BY i.created_at DESC`
  );
  return rows.map(rowToInvoice);
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  await ensureInit();
  const { rows } = await getPool().query(
    `SELECT i.*, c.name AS client_name, j.title AS job_title
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     LEFT JOIN jobs j ON i.job_id = j.id
     WHERE i.id = $1`, [id]
  );
  return rows[0] ? rowToInvoice(rows[0]) : null;
}

export type CreateInvoiceInput = Partial<Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at' | 'client_name' | 'job_title'>> & { amount: number };

export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  await ensureInit();
  const invoice_number = generateInvoiceNumber();
  const dueDate = data.due_date ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0];
  })();
  const { rows } = await getPool().query(
    `INSERT INTO invoices (job_id, quote_id, client_id, invoice_number, status, amount, due_date, payment_method, payment_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.job_id??null, data.quote_id??null, data.client_id??null,
     invoice_number, data.status??'draft', data.amount, dueDate,
     data.payment_method??'', data.payment_notes??'']
  );
  return rowToInvoice(rows[0]);
}

export async function createInvoiceFromQuote(quoteId: number): Promise<Invoice> {
  const quote = await getQuoteById(quoteId);
  if (!quote) throw new Error('Quote not found');
  return createInvoice({
    quote_id: quoteId,
    client_id: quote.client_id,
    job_id: quote.job_id,
    amount: quote.grand_total || quote.total,
    status: 'draft',
  });
}

export async function updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | null> {
  await ensureInit();
  const fields = ['status','amount','due_date','sent_at','viewed_at','paid_at',
    'payment_method','payment_notes','reminder_7_sent','reminder_14_sent','reminder_30_sent'] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals: any[] = [];
  const sets: string[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { vals.push(data[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (!sets.length) return getInvoiceById(id);
  vals.push(id);
  const { rows } = await getPool().query(
    `UPDATE invoices SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return rows[0] ? rowToInvoice(rows[0]) : null;
}

export async function deleteInvoice(id: number): Promise<void> {
  await ensureInit();
  await getPool().query('DELETE FROM invoices WHERE id = $1', [id]);
}
