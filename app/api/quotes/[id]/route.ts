import { getQuoteById, updateQuote, deleteQuote } from '@/lib/db';
import { calculateTotals } from '@/lib/calculations';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quote = await getQuoteById(Number(id));
    if (!quote) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(quote);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getQuoteById(Number(id));
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const materials = body.materials ?? existing.materials;
    const labor_hours = body.labor_hours ?? existing.labor_hours;
    const labor_rate = body.labor_rate ?? existing.labor_rate;
    const markup_percent = body.markup_percent ?? existing.markup_percent;

    const totals = calculateTotals(materials, labor_hours, labor_rate, markup_percent);
    const updated = await updateQuote(Number(id), { ...body, materials, ...totals });
    return Response.json(updated);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getQuoteById(Number(id));
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
    await deleteQuote(Number(id));
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
