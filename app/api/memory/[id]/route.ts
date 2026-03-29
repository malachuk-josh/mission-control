import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbRun, parseJsonField } from '@/lib/db';
import type { Memory } from '@/types';

function parseMemory(row: Record<string, unknown>): Memory {
  return { ...row, tags: parseJsonField(row.tags as string, []), pinned: Boolean(row.pinned) } as unknown as Memory;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM memories WHERE id = ?', [params.id]);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: parseMemory(row) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const now = new Date().toISOString();
  const allowed = ['title','content','tags','pinned','type'];
  const updates: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      if (key === 'tags') values.push(JSON.stringify(body[key]));
      else if (key === 'pinned') values.push(body[key] ? 1 : 0);
      else values.push(body[key]);
    }
  }
  values.push(params.id);
  await dbRun(`UPDATE memories SET ${updates.join(', ')} WHERE id = ?`, values);

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM memories WHERE id = ?', [params.id]);
  return NextResponse.json({ data: parseMemory(row!) });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await dbRun('DELETE FROM memories WHERE id = ?', [params.id]);
  return NextResponse.json({ message: 'Deleted' });
}
