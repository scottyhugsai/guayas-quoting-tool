import { NextRequest, NextResponse } from 'next/server';
import { getPool, ensureInit } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureInit();
    const { id } = await params;
    const d = await req.json();
    const fields = ['title', 'description', 'start_time', 'end_time', 'event_type', 'assigned_crew', 'job_id'] as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vals: any[] = [];
    const sets: string[] = [];
    for (const f of fields) {
      if (d[f] !== undefined) { vals.push(d[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    vals.push(id);
    const { rows } = await getPool().query(
      `UPDATE calendar_events SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals
    );
    return NextResponse.json(rows[0] ?? null);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureInit();
    const { id } = await params;
    await getPool().query('DELETE FROM calendar_events WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
