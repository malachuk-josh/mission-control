import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbGet, dbRun, parseJsonField } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import type { Agent } from '@/types';

function parseAgent(row: Record<string, unknown>): Agent {
  return {
    ...row,
    capabilities: parseJsonField(row.capabilities as string, []),
    token_used:       Number(row.token_used),
    token_limit:      Number(row.token_limit),
    completed_tasks:  Number(row.completed_tasks),
    health_score:     Number(row.health_score),
  } as unknown as Agent;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let sql = 'SELECT * FROM agents WHERE 1=1';
  const params: unknown[] = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY name ASC';

  const rows = await dbQuery<Record<string, unknown>>(sql, params);
  const agents = rows.map(parseAgent);

  for (const agent of agents) {
    if (agent.current_task_id) {
      const task = await dbGet<{ title: string; status: string }>(
        'SELECT title, status FROM tasks WHERE id = ?', [agent.current_task_id]
      );
      (agent as Agent & { current_task?: unknown }).current_task = task;
    }
  }

  return NextResponse.json({ data: agents });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const allowed = ['status','current_task_id','health_score','token_used','last_active'];
  const setParts: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in updates) { setParts.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (!setParts.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  values.push(id);
  await dbRun(`UPDATE agents SET ${setParts.join(', ')} WHERE id = ?`, values);

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM agents WHERE id = ?', [id]);
  const agent = parseAgent(row!);
  broadcastEvent('agent:updated', agent);

  return NextResponse.json({ data: agent });
}
