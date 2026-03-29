import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbGet, dbRun, parseJsonField } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import { v4 as uuidv4 } from 'uuid';
import type { Memory } from '@/types';

function parseMemory(row: Record<string, unknown>): Memory {
  return { ...row, tags: parseJsonField(row.tags as string, []), pinned: Boolean(row.pinned) } as Memory;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');
  const search = searchParams.get('q');
  const pinned = searchParams.get('pinned');
  const agentId = searchParams.get('agent_id');

  let sql = 'SELECT * FROM memories WHERE 1=1';
  const params: unknown[] = [];

  if (type)           { sql += ' AND type = ?';     params.push(type); }
  if (pinned === 'true') { sql += ' AND pinned = 1'; }
  if (agentId)        { sql += ' AND agent_id = ?'; params.push(agentId); }
  if (search) {
    sql += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY pinned DESC, updated_at DESC';

  const rows = await dbQuery<Record<string, unknown>>(sql, params);
  return NextResponse.json({ data: rows.map(parseMemory) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `mem-${uuidv4().split('-')[0]}`;
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO memories (id, title, content, tags, agent_id, task_id, created_at, updated_at, type, pinned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.title, body.content, JSON.stringify(body.tags ?? []),
     body.agent_id ?? null, body.task_id ?? null, now, now,
     body.type ?? 'note', body.pinned ? 1 : 0]
  );

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM memories WHERE id = ?', [id]);
  const memory = parseMemory(row!);
  broadcastEvent('memory:created', memory);

  return NextResponse.json({ data: memory }, { status: 201 });
}
