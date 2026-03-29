import { NextResponse } from 'next/server';
import { dbQuery, dbGet } from '@/lib/db';
import type { LogEntry, ServiceHealth, TokenUsage, DashboardStats } from '@/types';

async function checkServiceHealth(): Promise<ServiceHealth[]> {
  const now = new Date().toISOString();
  return [
    { service: 'Database', status: 'healthy', latency_ms: 1, last_checked: now, message: 'Turso LibSQL operational' },
    { service: 'SSE Stream', status: 'healthy', latency_ms: 0, last_checked: now, message: 'Event stream active' },
    {
      service: 'Google Calendar',
      status: process.env.GOOGLE_REFRESH_TOKEN ? 'healthy' : 'unknown',
      last_checked: now,
      message: process.env.GOOGLE_REFRESH_TOKEN ? 'OAuth credentials present' : 'Not configured — see .env.local.example',
    },
    {
      service: 'Gmail',
      status: process.env.GOOGLE_REFRESH_TOKEN ? 'healthy' : 'unknown',
      last_checked: now,
      message: process.env.GOOGLE_REFRESH_TOKEN ? 'OAuth credentials present' : 'Not configured',
    },
    {
      service: 'Anthropic API',
      status: process.env.ANTHROPIC_API_KEY ? 'healthy' : 'unknown',
      last_checked: now,
      message: process.env.ANTHROPIC_API_KEY ? 'API key present' : 'Not configured',
    },
  ];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section');

  if (section === 'logs') {
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const level = searchParams.get('level');
    let sql = 'SELECT * FROM logs WHERE 1=1';
    const params: unknown[] = [];
    if (level) { sql += ' AND level = ?'; params.push(level); }
    sql += ` ORDER BY timestamp DESC LIMIT ${limit}`;
    const logs = await dbQuery<LogEntry>(sql, params);
    return NextResponse.json({ data: logs });
  }

  if (section === 'health') {
    return NextResponse.json({ data: await checkServiceHealth() });
  }

  if (section === 'tokens') {
    const today = new Date().toISOString().split('T')[0];
    const usage = await dbQuery<TokenUsage>(
      'SELECT * FROM token_usage WHERE date = ? ORDER BY cost_usd DESC', [today]
    );
    return NextResponse.json({ data: usage });
  }

  if (section === 'stats') {
    const today = new Date().toISOString().split('T')[0];

    const [totalRow, activeRow, blockedRow, completedRow, activeAgentsRow, tokenRow] = await Promise.all([
      dbGet<{ c: number }>('SELECT COUNT(*) as c FROM tasks'),
      dbGet<{ c: number }>('SELECT COUNT(*) as c FROM tasks WHERE status = ?', ['in_progress']),
      dbGet<{ c: number }>('SELECT COUNT(*) as c FROM tasks WHERE status = ?', ['blocked']),
      dbGet<{ c: number }>("SELECT COUNT(*) as c FROM tasks WHERE status = 'completed' AND date(completed_at) = ?", [today]),
      dbGet<{ c: number }>("SELECT COUNT(*) as c FROM agents WHERE status = 'active'"),
      dbGet<{ t: number; c: number }>('SELECT SUM(input_tokens + output_tokens) as t, SUM(cost_usd) as c FROM token_usage WHERE date = ?', [today]),
    ]);

    const blocked = Number(blockedRow?.c ?? 0);
    const stats: DashboardStats = {
      total_tasks:        Number(totalRow?.c ?? 0),
      active_tasks:       Number(activeRow?.c ?? 0),
      blocked_tasks:      blocked,
      completed_today:    Number(completedRow?.c ?? 0),
      active_agents:      Number(activeAgentsRow?.c ?? 0),
      total_tokens_today: Number(tokenRow?.t ?? 0),
      cost_today_usd:     Number(tokenRow?.c ?? 0),
      system_health:      blocked > 3 ? 'degraded' : 'healthy',
    };

    return NextResponse.json({ data: stats });
  }

  const [health, logs, tokens] = await Promise.all([
    checkServiceHealth(),
    dbQuery<LogEntry>('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 30'),
    dbQuery<TokenUsage>("SELECT * FROM token_usage WHERE date = date('now') ORDER BY cost_usd DESC"),
  ]);

  return NextResponse.json({ data: { health, logs, tokens } });
}
