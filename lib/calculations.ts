import type { Material } from './db';

export interface QuoteTotals {
  materials_total: number;
  labor_total: number;
  subtotal: number;
  markup_amount: number;
  total: number;
}

export function calculateTotals(
  materials: Material[],
  labor_hours: number,
  labor_rate: number,
  markup_percent: number
): QuoteTotals {
  const materials_total = materials.reduce((sum, m) => sum + m.quantity * m.unit_cost, 0);
  const labor_total = labor_hours * labor_rate;
  const subtotal = materials_total + labor_total;
  const markup_amount = subtotal * (markup_percent / 100);
  const total = subtotal + markup_amount;
  return { materials_total, labor_total, subtotal, markup_amount, total };
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
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  accepted: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
} as const;
