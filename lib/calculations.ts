import type { Material } from './db';

export interface QuoteTotals {
  materials_total: number;
  labor_total: number;
  subtotal: number;
  markup_amount: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  grand_total: number;
}

export function calculateTotals(
  materials: Material[],
  labor_hours: number,
  labor_rate: number,
  markup_percent: number,
  tax_rate: number = 0,
  discount_type: 'none' | 'percent' | 'flat' = 'none',
  discount_value: number = 0
): QuoteTotals {
  const materials_total = materials.reduce((sum, m) => sum + m.quantity * m.unit_cost, 0);
  const labor_total = labor_hours * labor_rate;
  const subtotal = materials_total + labor_total;
  const markup_amount = subtotal * (markup_percent / 100);
  const pre_discount = subtotal + markup_amount;
  const discount_amount =
    discount_type === 'percent' ? pre_discount * (discount_value / 100) :
    discount_type === 'flat'    ? discount_value :
    0;
  const after_discount = Math.max(0, pre_discount - discount_amount);
  const tax_amount = after_discount * (tax_rate / 100);
  const total = pre_discount;
  const grand_total = after_discount + tax_amount;
  return { materials_total, labor_total, subtotal, markup_amount, discount_amount, tax_amount, total, grand_total };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
}

export const SERVICE_TYPES = [
  'Roofing',
  'Siding',
  'Framing',
  'Fencing',
  'Bathroom Remodel',
  'Demolition',
  'Dumpster',
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

export const STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
} as const;

export const STATUS_COLORS = {
  draft:    'bg-slate-700 text-slate-200',
  sent:     'bg-blue-900 text-blue-200',
  accepted: 'bg-emerald-900 text-emerald-200',
  rejected: 'bg-red-900 text-red-300',
} as const;

export const INVOICE_STATUS_COLORS = {
  draft:   'bg-slate-700 text-slate-200',
  sent:    'bg-blue-900 text-blue-200',
  viewed:  'bg-purple-900 text-purple-200',
  paid:    'bg-emerald-900 text-emerald-200',
  overdue: 'bg-red-900 text-red-300',
} as const;

export const CLAIM_STATUS_COLORS = {
  pending:               'bg-yellow-900 text-yellow-200',
  approved:              'bg-emerald-900 text-emerald-200',
  denied:                'bg-red-900 text-red-300',
  supplement_submitted:  'bg-blue-900 text-blue-200',
  closed:                'bg-slate-700 text-slate-200',
} as const;
