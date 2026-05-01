import { NextRequest, NextResponse } from 'next/server';
import { getAllClients, createClient } from '@/lib/db/clients';

export async function GET() {
  try {
    return NextResponse.json(await getAllClients());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json(await createClient(data), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
