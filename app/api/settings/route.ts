import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await updateSettings(body);
    const settings = await getSettings();
    return Response.json(settings);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
