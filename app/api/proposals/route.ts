import { NextRequest, NextResponse } from 'next/server';
import { getAllProposals, createProposal } from '@/lib/db/proposals';

export async function GET() {
  try {
    return NextResponse.json(await getAllProposals());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json(await createProposal(data), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
