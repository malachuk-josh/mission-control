'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Brain, Calendar, Users, Building2,
  Activity, ChevronRight, Radio,
} from 'lucide-react';
import { cn, statusDot } from '@/lib/utils';
import { useAgents } from '@/hooks/useAgents';
import { useStats } from '@/hooks/useStats';

const NAV = [
  { href: '/dashboard/tasks',    icon: LayoutGrid, label: 'Task Board',      shortcut: '1' },
  { href: '/dashboard/memory',   icon: Brain,       label: 'Memory',          shortcut: '2' },
  { href: '/dashboard/calendar', icon: Calendar,    label: 'Calendar',        shortcut: '3' },
  { href: '/dashboard/team',     icon: Users,       label: 'Team',            shortcut: '4' },
  { href: '/dashboard/office',   icon: Building2,   label: 'Digital Office',  shortcut: '5' },
  { href: '/dashboard/ops',      icon: Activity,    label: 'Ops Panel',       shortcut: '6' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: agents } = useAgents();
  const { data: stats } = useStats();

  const activeAgents = agents?.filter((a) => a.status === 'active') ?? [];

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-bg-surface border-r border-bg-border h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-neon-green" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          </div>
          <div>
            <div className="font-mono font-bold text-text-primary text-sm tracking-widest uppercase">
              Mission
            </div>
            <div className="font-mono font-bold text-neon-green text-sm tracking-widest uppercase -mt-0.5 glow-green">
              Control
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[10px] text-text-muted flex items-center gap-1.5">
          <span className={cn('w-1.5 h-1.5 rounded-full', stats?.system_health === 'healthy' ? 'bg-neon-green' : 'bg-neon-yellow')} />
          {stats?.system_health === 'healthy' ? 'ALL SYSTEMS NOMINAL' : 'DEGRADED STATE'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label, shortcut }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-all duration-150 group',
                isActive
                  ? 'bg-bg-elevated text-text-primary border-l-2 border-neon-cyan'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-neon-cyan')} />
              <span className="font-mono text-xs flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-neon-cyan opacity-70" />}
              {!isActive && (
                <kbd className="text-[9px] font-mono text-text-muted bg-bg-elevated px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {shortcut}
                </kbd>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Active Agents */}
      {activeAgents.length > 0 && (
        <div className="border-t border-bg-border p-3">
          <div className="font-mono text-[9px] text-text-muted mb-2 uppercase tracking-wider">
            Active Agents
          </div>
          <div className="space-y-1.5">
            {activeAgents.slice(0, 3).map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 status-pulse', statusDot(agent.status))} />
                <span className="font-mono text-xs text-text-secondary truncate">{agent.name}</span>
              </div>
            ))}
            {activeAgents.length > 3 && (
              <div className="font-mono text-[10px] text-text-muted">
                +{activeAgents.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="border-t border-bg-border p-3 space-y-1">
        <div className="flex justify-between font-mono text-[10px] text-text-muted">
          <span>Tasks active</span>
          <span className="text-neon-cyan">{stats?.active_tasks ?? '—'}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px] text-text-muted">
          <span>Done today</span>
          <span className="text-neon-green">{stats?.completed_today ?? '—'}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px] text-text-muted">
          <span>Cost today</span>
          <span className="text-neon-yellow">${stats?.cost_today_usd?.toFixed(2) ?? '—'}</span>
        </div>
      </div>
    </aside>
  );
}
