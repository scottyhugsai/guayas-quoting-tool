import { NextRequest, NextResponse } from 'next/server';
import { getSupplementsByClaim, createSupplement, updateSupplement, deleteSupplement } from '@/lib/db/insurance';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await getSupplementsByClaim(Number(id)));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    return NextResponse.json(await createSupplement({ ...data, claim_id: Number(id) }), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { suppId, ...rest } = data;
    const supp = await updateSupplement(Number(suppId), rest);
    if (!supp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(supp);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params;
    const { suppId } = await req.json();
    await deleteSupplement(Number(suppId));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
