import { NextRequest, NextResponse } from 'next/server';
import { updateProposalTier, selectProposalTier } from '@/lib/db/proposals';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; tierId: string }> }) {
  try {
    const { id, tierId } = await params;
    const data = await req.json();
    if (data.select) {
      await selectProposalTier(Number(id), Number(tierId));
      return NextResponse.json({ ok: true });
    }
    const tier = await updateProposalTier(Number(tierId), data);
    if (!tier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(tier);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
