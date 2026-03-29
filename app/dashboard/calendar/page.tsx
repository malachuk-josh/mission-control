'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, RefreshCw, Play, Pause, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn, formatDate, formatRelative } from '@/lib/utils';
import type { CalendarEvent, ScheduledTask } from '@/types';

function useCalendarEvents(syncGoogle = false) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar', syncGoogle],
    queryFn: async () => {
      const url = new URL('/api/calendar', window.location.origin);
      if (syncGoogle) url.searchParams.set('sync', 'true');
      const res = await fetch(url.toString());
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 60_000,
  });
}

function useScheduledTasks() {
  return useQuery<ScheduledTask[]>({
    queryKey: ['scheduled-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/scheduled-tasks');
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 30_000,
  });
}

const STATUS_ICON: Record<string, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  failure: XCircle,
  running: RefreshCw,
  pending: Clock,
};

const STATUS_COLOR: Record<string, string> = {
  success: 'text-neon-green',
  failure: 'text-neon-red',
  running: 'text-neon-cyan',
  pending: 'text-text-muted',
};

function CronDisplay({ cron }: { cron?: string }) {
  if (!cron) return <span className="text-text-muted">—</span>;
  const labels: Record<string, string> = {
    '0 8 * * *': 'Daily at 08:00',
    '0 9 * * 1': 'Monday at 09:00',
    '0 0 * * *': 'Nightly at 00:00',
    '0 0 1 * *': '1st of month',
  };
  return <span>{labels[cron] ?? cron}</span>;
}

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'scheduled'>('scheduled');
  const [syncing, setSyncing] = useState(false);
  const { data: events = [] } = useCalendarEvents();
  const { data: scheduledTasks = [], refetch } = useScheduledTasks();

  const syncGCal = async () => {
    setSyncing(true);
    await fetch('/api/calendar?sync=true');
    await refetch();
    setSyncing(false);
  };

  const toggleTask = async (task: ScheduledTask) => {
    await fetch('/api/scheduled-tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, enabled: !task.enabled }),
    });
    refetch();
  };

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const date = event.start.split('T')[0];
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(event);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center gap-2">
          {(['scheduled', 'events'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'font-mono text-xs px-3 py-1.5 rounded transition-colors capitalize',
                activeTab === tab
                  ? 'bg-bg-elevated text-text-primary border border-bg-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {tab === 'scheduled' ? 'Scheduled Tasks' : 'Calendar Events'}
            </button>
          ))}
        </div>
        <button
          onClick={syncGCal}
          className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded bg-bg-elevated border border-bg-border text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
          Sync Google
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'scheduled' && (
          <div className="space-y-2">
            <div className="font-mono text-[10px] text-text-muted mb-3 uppercase tracking-wider">
              {scheduledTasks.length} automation{scheduledTasks.length !== 1 && 's'} registered
            </div>
            {scheduledTasks.map((task) => {
              const StatusIcon = STATUS_ICON[task.last_status ?? 'pending'];
              const statusColor = STATUS_COLOR[task.last_status ?? 'pending'];

              return (
                <div
                  key={task.id}
                  className={cn(
                    'bg-bg-surface border border-bg-border rounded-lg p-4 transition-all',
                    !task.enabled && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          task.enabled ? 'bg-neon-green animate-pulse' : 'bg-text-muted'
                        )} />
                        <span className="font-mono text-sm text-text-primary font-medium truncate">{task.name}</span>
                        <span className={cn('font-mono text-[9px] px-1.5 py-0.5 rounded uppercase bg-bg-elevated border border-bg-border', {
                          'text-neon-cyan': task.source === 'claude',
                          'text-neon-yellow': task.source === 'google',
                          'text-text-muted': task.source === 'local',
                        })}>
                          {task.source}
                        </span>
                      </div>
                      {task.description && (
                        <p className="font-mono text-xs text-text-muted ml-4 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 ml-4 font-mono text-[10px] text-text-muted flex-wrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <CronDisplay cron={task.cron_expression} />
                        </div>
                        {task.next_run && (
                          <div>Next: <span className="text-text-secondary">{formatRelative(task.next_run)}</span></div>
                        )}
                        {task.last_run && (
                          <div>Last: <span className="text-text-secondary">{formatRelative(task.last_run)}</span></div>
                        )}
                        <div>Runs: <span className="text-neon-cyan">{task.run_count}</span></div>
                        {task.error_count > 0 && (
                          <div className="text-neon-red">Errors: {task.error_count}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Last status */}
                      <div className={cn('flex items-center gap-1 font-mono text-[10px]', statusColor)}>
                        <StatusIcon className={cn('w-3.5 h-3.5', task.last_status === 'running' && 'animate-spin')} />
                        <span className="hidden sm:block">{task.last_status ?? 'pending'}</span>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => toggleTask(task)}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          task.enabled
                            ? 'text-neon-green hover:bg-red-950/30 hover:text-neon-red'
                            : 'text-text-muted hover:bg-bg-elevated hover:text-neon-green'
                        )}
                        title={task.enabled ? 'Disable' : 'Enable'}
                      >
                        {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            {Object.keys(eventsByDate).length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Calendar className="w-8 h-8 text-text-muted" />
                <span className="font-mono text-sm text-text-muted">No events loaded</span>
                <button onClick={syncGCal} className="font-mono text-xs text-neon-cyan hover:underline">
                  Sync Google Calendar to load events →
                </button>
              </div>
            )}
            {Object.entries(eventsByDate).map(([date, dayEvents]) => (
              <div key={date}>
                <div className="font-mono text-xs text-neon-cyan mb-2 uppercase tracking-wider">
                  {formatDate(date, 'EEEE, MMM d')}
                </div>
                <div className="space-y-2 pl-3 border-l border-bg-border">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="bg-bg-surface border border-bg-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-text-primary">{event.title}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn('font-mono text-[9px] px-1.5 py-0.5 rounded uppercase bg-bg-elevated border border-bg-border', {
                            'text-neon-cyan': event.source === 'google',
                            'text-text-muted': event.source === 'local',
                          })}>
                            {event.source}
                          </span>
                          {event.recurrence && <span className="font-mono text-[9px] text-neon-purple">recurring</span>}
                        </div>
                      </div>
                      {event.description && (
                        <p className="font-mono text-xs text-text-muted mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-text-muted">
                        <Clock className="w-3 h-3" />
                        <span>{event.start.includes('T') ? event.start.split('T')[1].slice(0, 5) : 'All day'}</span>
                        {event.end.includes('T') && (
                          <span>→ {event.end.split('T')[1].slice(0, 5)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
