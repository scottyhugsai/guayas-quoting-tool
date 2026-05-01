import { NextRequest, NextResponse } from 'next/server';
import { getClaimById, updateClaim } from '@/lib/db/insurance';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const claim = await getClaimById(Number(id));
    if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(claim);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const claim = await updateClaim(Number(id), data);
    if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(claim);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
