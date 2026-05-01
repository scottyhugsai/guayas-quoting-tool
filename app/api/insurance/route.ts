import { NextRequest, NextResponse } from 'next/server';
import { getAllClaims, createClaim } from '@/lib/db/insurance';

export async function GET() {
  try {
    return NextResponse.json(await getAllClaims());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json(await createClaim(data), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
