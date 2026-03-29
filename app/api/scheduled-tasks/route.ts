import { NextResponse } from 'next/server';
import { dbQuery, dbRun } from '@/lib/db';
import type { ScheduledTask } from '@/types';

export async function GET() {
  const rows = await dbQuery<ScheduledTask>(
    'SELECT * FROM scheduled_tasks ORDER BY enabled DESC, next_run ASC'
  );
  return NextResponse.json({ data: rows });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, enabled } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await dbRun('UPDATE scheduled_tasks SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
  return NextResponse.json({ message: 'Updated' });
}
