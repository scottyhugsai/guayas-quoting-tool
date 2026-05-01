import { getAllQuotes, createQuote } from '@/lib/db';
import { calculateTotals } from '@/lib/calculations';

export async function GET() {
  try {
    const quotes = await getAllQuotes();
    return Response.json(quotes);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      client_name, address, phone, email, service_type,
      square_footage, materials, labor_hours, labor_rate,
      markup_percent, notes, status,
    } = body;

    const totals = calculateTotals(materials ?? [], labor_hours ?? 0, labor_rate ?? 75, markup_percent ?? 20);

    const quote = await createQuote({
      client_name, address, phone, email, service_type,
      square_footage: square_footage ?? null,
      materials: materials ?? [],
      labor_hours: labor_hours ?? 0,
      labor_rate: labor_rate ?? 75,
      markup_percent: markup_percent ?? 20,
      notes: notes ?? '',
      status: status ?? 'draft',
      ...totals,
    });

    return Response.json(quote, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
