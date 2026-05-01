import { NextRequest, NextResponse } from 'next/server';
import { getPool, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const { rows } = await getPool().query(
      `SELECT ce.*, j.title AS job_title, c.name AS client_name
       FROM calendar_events ce
       LEFT JOIN jobs j ON ce.job_id = j.id
       LEFT JOIN clients c ON j.client_id = c.id
       ORDER BY ce.start_time ASC`
    );
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const d = await req.json();
    const { rows } = await getPool().query(
      `INSERT INTO calendar_events (job_id, title, description, start_time, end_time, event_type, assigned_crew)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [d.job_id ?? null, d.title, d.description ?? '', d.start_time, d.end_time ?? null,
       d.event_type ?? 'work', d.assigned_crew ?? '']
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
