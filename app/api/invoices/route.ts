import { NextRequest, NextResponse } from 'next/server';
import { getAllInvoices, createInvoice, createInvoiceFromQuote } from '@/lib/db/invoices';

export async function GET() {
  try {
    return NextResponse.json(await getAllInvoices());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (data.from_quote_id) {
      return NextResponse.json(await createInvoiceFromQuote(data.from_quote_id), { status: 201 });
    }
    return NextResponse.json(await createInvoice(data), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
