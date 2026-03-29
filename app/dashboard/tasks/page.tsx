import { KanbanBoard } from '@/components/tasks/KanbanBoard';

export default function TasksPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="font-mono text-sm font-semibold text-text-primary">Task Board</h1>
        <span className="font-mono text-[10px] text-text-muted">
          Drag cards between columns · Click to inspect · + to create
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanBoard />
      </div>
    </div>
  );
}
