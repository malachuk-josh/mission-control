'use client';

import { useState } from 'react';
import { X, Save, Trash2, Brain, Calendar, User, Tag, Zap, Clock } from 'lucide-react';
import { cn, priorityBadgeClass, statusColor, formatDate, formatRelative } from '@/lib/utils';
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import type { Task, Agent, TaskStatus, TaskPriority } from '@/types';

interface TaskModalProps {
  task: Task;
  agents: Agent[];
  onClose: () => void;
}

const STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'blocked', 'completed'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export function TaskModal({ task, agents, onClose }: TaskModalProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task });
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const save = async () => {
    await updateTask.mutateAsync({
      id: task.id,
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      owner: form.owner,
      due_date: form.due_date,
      tags: form.tags,
    });
    setEditing(false);
    onClose();
  };

  const del = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask.mutateAsync(task.id);
      onClose();
    }
  };

  const owner = agents.find((a) => a.id === task.owner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-bg-surface border border-bg-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-muted">{task.id}</span>
            <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded uppercase', priorityBadgeClass(task.priority))}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="font-mono text-xs px-2.5 py-1 rounded bg-bg-elevated hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            {editing && (
              <button
                onClick={save}
                className="font-mono text-xs px-2.5 py-1 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 transition-colors flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            )}
            <button onClick={del} className="p-1.5 rounded hover:bg-red-950 text-text-muted hover:text-neon-red transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Title */}
          {editing ? (
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full font-mono text-base text-text-primary bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 mb-4 outline-none focus:border-neon-cyan"
            />
          ) : (
            <h2 className="font-mono text-base text-text-primary font-semibold mb-4">{task.title}</h2>
          )}

          {/* Status + Priority row */}
          <div className="flex gap-3 mb-5 flex-wrap">
            {editing ? (
              <>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                  className="font-mono text-xs bg-bg-elevated border border-bg-border rounded px-2 py-1.5 text-text-primary outline-none"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                  className="font-mono text-xs bg-bg-elevated border border-bg-border rounded px-2 py-1.5 text-text-primary outline-none"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  className="font-mono text-xs bg-bg-elevated border border-bg-border rounded px-2 py-1.5 text-text-primary outline-none"
                >
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </>
            ) : (
              <>
                <span className={cn('font-mono text-xs px-2 py-1 rounded bg-bg-elevated border border-bg-border', statusColor(task.status))}>
                  {task.status}
                </span>
                <div className="flex items-center gap-1 font-mono text-xs text-text-secondary">
                  <User className="w-3 h-3" />
                  {owner?.name ?? task.owner}
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1 font-mono text-xs text-text-secondary">
                    <Calendar className="w-3 h-3" />
                    {formatDate(task.due_date)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Description</div>
            {editing ? (
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full font-mono text-xs text-text-primary bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 outline-none focus:border-neon-cyan resize-none"
              />
            ) : (
              <div className="font-mono text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {task.description || <span className="text-text-muted italic">No description</span>}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Tags
            </div>
            {editing ? (
              <input
                value={form.tags?.join(', ') ?? ''}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                placeholder="tag1, tag2, tag3"
                className="w-full font-mono text-xs text-text-primary bg-bg-elevated border border-bg-border rounded px-2 py-1.5 outline-none"
              />
            ) : (
              <div className="flex gap-1.5 flex-wrap">
                {task.tags?.map((tag) => (
                  <span key={tag} className="font-mono text-[10px] text-text-secondary bg-bg-elevated px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-bg-border">
            <div>
              <div className="font-mono text-[9px] text-text-muted uppercase mb-0.5">Created</div>
              <div className="font-mono text-xs text-text-secondary">{formatRelative(task.created_at)}</div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-text-muted uppercase mb-0.5">Updated</div>
              <div className="font-mono text-xs text-text-secondary">{formatRelative(task.updated_at)}</div>
            </div>
            {task.token_cost && task.token_cost > 0 ? (
              <div>
                <div className="font-mono text-[9px] text-text-muted uppercase mb-0.5">Token Cost</div>
                <div className="font-mono text-xs text-neon-yellow flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {task.token_cost.toLocaleString()}
                </div>
              </div>
            ) : null}
            <div>
              <div className="font-mono text-[9px] text-text-muted uppercase mb-0.5">Source</div>
              <div className="font-mono text-xs text-text-secondary">{task.source ?? 'manual'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
