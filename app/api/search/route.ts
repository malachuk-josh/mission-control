import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import type { SearchResult } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  const like = `%${q}%`;
  const results: SearchResult[] = [];

  const [tasks, memories, agents] = await Promise.all([
    dbQuery<{ id: string; title: string; description: string; status: string; priority: string }>(
      'SELECT id, title, description, status, priority FROM tasks WHERE title LIKE ? OR description LIKE ? LIMIT 5',
      [like, like]
    ),
    dbQuery<{ id: string; title: string; content: string; type: string }>(
      'SELECT id, title, content, type FROM memories WHERE title LIKE ? OR content LIKE ? LIMIT 5',
      [like, like]
    ),
    dbQuery<{ id: string; name: string; role: string; status: string }>(
      'SELECT id, name, role, status FROM agents WHERE name LIKE ? OR role LIKE ? LIMIT 3',
      [like, like]
    ),
  ]);

  for (const t of tasks) {
    results.push({ type: 'task', id: t.id, title: t.title, excerpt: t.description?.slice(0, 100), meta: `${t.status} · ${t.priority}`, url: `/dashboard/tasks?highlight=${t.id}` });
  }
  for (const m of memories) {
    results.push({ type: 'memory', id: m.id, title: m.title, excerpt: m.content.slice(0, 100), meta: m.type, url: `/dashboard/memory?id=${m.id}` });
  }
  for (const a of agents) {
    results.push({ type: 'agent', id: a.id, title: a.name, excerpt: a.role, meta: a.status, url: `/dashboard/team?agent=${a.id}` });
  }

  return NextResponse.json({ data: results });
}
