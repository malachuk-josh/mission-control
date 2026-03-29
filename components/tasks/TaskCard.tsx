'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, User, Zap, Brain, Tag } from 'lucide-react';
import { cn, formatDate, priorityBadgeClass, priorityColor, truncate } from '@/lib/utils';
import type { Task, Agent } from '@/types';

interface TaskCardProps {
  task: Task;
  agents: Agent[];
  onClick: (task: Task) => void;
}

const PRIORITY_INDICATOR: Record<string, string> = {
  critical: 'border-l-neon-red',
  high: 'border-l-neon-orange',
  medium: 'border-l-neon-yellow',
  low: 'border-l-bg-border',
};

export function TaskCard({ task, agents, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const owner = agents.find((a) => a.id === task.owner);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-bg-elevated border border-bg-border rounded-lg p-3 cursor-pointer',
        'border-l-2 transition-all duration-150 group',
        PRIORITY_INDICATOR[task.priority] || 'border-l-bg-border',
        isDragging && 'opacity-40 scale-95',
        'hover:border-bg-hover hover:shadow-lg'
      )}
      onClick={() => onClick(task)}
    >
      {/* Drag handle + title row */}
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-text-primary font-medium leading-snug">
            {task.title}
          </div>
          {task.description && (
            <div className="font-mono text-[10px] text-text-muted mt-1 leading-relaxed">
              {truncate(task.description, 80)}
            </div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        {/* Priority badge */}
        <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider', priorityBadgeClass(task.priority))}>
          {task.priority}
        </span>

        {/* Owner */}
        {owner && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
            <User className="w-2.5 h-2.5" />
            <span>{owner.name}</span>
          </div>
        )}

        {/* Due date */}
        {task.due_date && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-mono',
            new Date(task.due_date) < new Date() ? 'text-neon-red' : 'text-text-muted'
          )}>
            <Calendar className="w-2.5 h-2.5" />
            <span>{formatDate(task.due_date, 'MMM d')}</span>
          </div>
        )}

        {/* Linked memory */}
        {task.memory_id && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-neon-purple">
            <Brain className="w-2.5 h-2.5" />
          </div>
        )}

        {/* Token cost */}
        {task.token_cost && task.token_cost > 0 ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted ml-auto">
            <Zap className="w-2.5 h-2.5" />
            <span>{(task.token_cost / 1000).toFixed(1)}k</span>
          </div>
        ) : null}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[9px] font-mono text-text-muted bg-bg-base px-1 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
