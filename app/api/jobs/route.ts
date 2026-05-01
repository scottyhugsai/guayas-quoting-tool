import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs, createJob } from '@/lib/db/jobs';

export async function GET() {
  try {
    return NextResponse.json(await getAllJobs());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json(await createJob(data), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
