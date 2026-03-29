import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbRun, parseJsonField } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from '@/types';

function parseTask(row: Record<string, unknown>): Task {
  return { ...row, tags: parseJsonField(row.tags as string, []) } as Task;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', [params.id]);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: parseTask(row) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const now = new Date().toISOString();

  const allowed = ['title','description','status','priority','owner','due_date','memory_id','tags','token_cost','sort_order'];
  const updates: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(key === 'tags' ? JSON.stringify(body[key]) : body[key]);
    }
  }
  if (body.status === 'completed') { updates.push('completed_at = ?'); values.push(now); }

  values.push(params.id);
  await dbRun(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', [params.id]);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const task = parseTask(row);
  broadcastEvent('task:updated', task);

  if (body.status) {
    await dbRun(
      `INSERT INTO logs (id, level, message, task_id, timestamp) VALUES (?, 'info', ?, ?, ?)`,
      [uuidv4(), `Task "${task.title}" → ${body.status}`, params.id, now]
    );
  }

  return NextResponse.json({ data: task });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', [params.id]);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await dbRun('DELETE FROM tasks WHERE id = ?', [params.id]);
  broadcastEvent('task:deleted', { id: params.id });
  return NextResponse.json({ message: 'Deleted' });
}
