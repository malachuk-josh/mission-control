import { dbGet, dbRun } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';
import { v4 as uuidv4 } from 'uuid';
import type { ScheduledTask } from '@/types';

export interface ClaudeScheduledTaskRaw {
  id: string; name: string; description?: string;
  schedule?: string; last_run?: string; next_run?: string;
  status?: string; agent?: string;
}

export async function syncScheduledTasks(externalTasks: ClaudeScheduledTaskRaw[]) {
  for (const task of externalTasks) {
    const existing = await dbGet<ScheduledTask>('SELECT id FROM scheduled_tasks WHERE id = ?', [task.id]);
    if (existing) {
      await dbRun(
        `UPDATE scheduled_tasks SET last_run = ?, next_run = ?, last_status = ? WHERE id = ?`,
        [task.last_run ?? null, task.next_run ?? null, task.status ?? 'pending', task.id]
      );
    } else {
      const now = new Date().toISOString();
      await dbRun(
        `INSERT INTO scheduled_tasks (id, name, description, next_run, last_run, last_status, enabled, run_count, error_count, created_at, source)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, ?, 'claude')`,
        [task.id, task.name, task.description ?? null, task.next_run ?? null, task.last_run ?? null, task.status ?? 'pending', now]
      );
    }
  }
}

export async function logAgentAction(params: {
  agentId: string; title: string; description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[]; tokenCost?: number;
}) {
  const id = `task-${uuidv4().split('-')[0]}`;
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO tasks (id, title, description, status, priority, owner, tags, created_at, updated_at, source, token_cost)
     VALUES (?, ?, ?, 'in_progress', ?, ?, ?, ?, ?, 'agent', ?)`,
    [id, params.title, params.description ?? null, params.priority ?? 'medium',
     params.agentId, JSON.stringify(params.tags ?? []), now, now, params.tokenCost ?? 0]
  );

  await dbRun(`UPDATE agents SET last_active = ?, status = 'active' WHERE id = ?`, [now, params.agentId]);

  const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
  broadcastEvent('task:created', task);
  return id;
}

export async function completeAgentTask(taskId: string, agentId: string, tokenCost?: number) {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ?, token_cost = COALESCE(token_cost, 0) + ? WHERE id = ?`,
    [now, now, tokenCost ?? 0, taskId]
  );
  await dbRun(
    `UPDATE agents SET completed_tasks = completed_tasks + 1, token_used = token_used + ?, last_active = ? WHERE id = ?`,
    [tokenCost ?? 0, now, agentId]
  );
  const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
  broadcastEvent('task:updated', task);
}
