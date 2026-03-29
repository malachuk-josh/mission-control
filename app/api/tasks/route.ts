import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbGet, dbRun, parseJsonField } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from '@/types';

function parseTask(row: Record<string, unknown>): Task {
  return { ...row, tags: parseJsonField(row.tags as string, []) } as unknown as Task;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const owner = searchParams.get('owner');
  const search = searchParams.get('q');

  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params: unknown[] = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (owner)  { sql += ' AND owner = ?';  params.push(owner);  }
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY sort_order ASC, updated_at DESC';

  const rows = await dbQuery<Record<string, unknown>>(sql, params);
  return NextResponse.json({ data: rows.map(parseTask) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `task-${uuidv4().split('-')[0]}`;
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO tasks (id, title, description, status, priority, owner, due_date, memory_id, tags, created_at, updated_at, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.title, body.description ?? null, body.status ?? 'backlog',
     body.priority ?? 'medium', body.owner ?? 'system', body.due_date ?? null,
     body.memory_id ?? null, JSON.stringify(body.tags ?? []), now, now, body.source ?? 'manual']
  );

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', [id]);
  const task = parseTask(row!);
  broadcastEvent('task:created', task);

  await dbRun(
    `INSERT INTO logs (id, level, message, agent_id, task_id, timestamp) VALUES (?, 'info', ?, ?, ?, ?)`,
    [uuidv4(), `Task created: ${body.title}`, body.owner ?? null, id, now]
  );

  return NextResponse.json({ data: task }, { status: 201 });
}
