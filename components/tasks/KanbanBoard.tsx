'use client';

import { useState, useMemo } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, AlertCircle, Clock, CheckCircle2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks, useUpdateTask, useCreateTask } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import type { Task, TaskStatus } from '@/types';

const COLUMNS: { id: TaskStatus; label: string; icon: React.FC<{ className?: string }>; color: string; dotColor: string }[] = [
  { id: 'backlog',     label: 'Backlog',     icon: Archive,       color: 'text-text-secondary', dotColor: 'bg-text-muted' },
  { id: 'in_progress', label: 'In Progress', icon: Clock,         color: 'text-neon-cyan',       dotColor: 'bg-neon-cyan' },
  { id: 'blocked',     label: 'Blocked',     icon: AlertCircle,   color: 'text-neon-red',        dotColor: 'bg-neon-red' },
  { id: 'completed',   label: 'Completed',   icon: CheckCircle2,  color: 'text-neon-green',      dotColor: 'bg-neon-green' },
];

function KanbanColumn({
  status,
  tasks,
  label,
  icon: Icon,
  color,
  dotColor,
  agents,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  dotColor: string;
  agents: ReturnType<typeof useAgents>['data'];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor, status === 'in_progress' && 'animate-pulse')} />
          <Icon className={cn('w-3.5 h-3.5', color)} />
          <span className={cn('font-mono text-xs font-medium', color)}>{label}</span>
          <span className="font-mono text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
          title={`Add to ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 p-1 rounded-lg min-h-[120px] transition-all',
          isOver && 'kanban-drop-over'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              agents={agents ?? []}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16 border border-dashed border-bg-border rounded-lg">
            <span className="font-mono text-[10px] text-text-muted">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface NewTaskForm {
  status: TaskStatus;
  title: string;
}

export function KanbanBoard() {
  const { data: tasks = [] } = useTasks();
  const { data: agents = [] } = useAgents();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState<NewTaskForm | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      backlog: [], in_progress: [], blocked: [], completed: [],
    };
    for (const task of tasks) {
      if (groups[task.status]) groups[task.status].push(task);
    }
    return groups;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // If dropped on a column (status ID), update status
    const newStatus = COLUMNS.find((c) => c.id === overId);
    if (newStatus) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== newStatus.id) {
        updateTask.mutate({ id: taskId, status: newStatus.id });
      }
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setNewTaskForm({ status, title: '' });
    setNewTitle('');
  };

  const submitNewTask = async () => {
    if (!newTitle.trim() || !newTaskForm) return;
    await createTask.mutateAsync({
      title: newTitle.trim(),
      status: newTaskForm.status,
      priority: 'medium',
      owner: agents[0]?.id ?? 'system',
      tags: [],
      source: 'manual',
    });
    setNewTaskForm(null);
    setNewTitle('');
  };

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="h-full flex gap-4 p-4 overflow-x-auto">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              label={col.label}
              icon={col.icon}
              color={col.color}
              dotColor={col.dotColor}
              tasks={tasksByStatus[col.id]}
              agents={agents}
              onTaskClick={setSelectedTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 opacity-90">
              <TaskCard task={activeTask} agents={agents} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* New task quick-add */}
      {newTaskForm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center pb-8 bg-black/50">
          <div className="bg-bg-surface border border-bg-border rounded-xl p-4 w-full max-w-md mx-4 shadow-2xl">
            <div className="font-mono text-xs text-text-muted mb-2">
              New task → <span className="text-neon-cyan">{newTaskForm.status}</span>
            </div>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewTask();
                if (e.key === 'Escape') setNewTaskForm(null);
              }}
              placeholder="Task title..."
              className="w-full font-mono text-sm bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary outline-none focus:border-neon-cyan mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setNewTaskForm(null)}
                className="font-mono text-xs px-3 py-1.5 rounded bg-bg-elevated text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={submitNewTask}
                className="font-mono text-xs px-3 py-1.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          agents={agents}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
