'use client';

import { usePathname } from 'next/navigation';
import { Bell, RefreshCw } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { useStats } from '@/hooks/useStats';
import { useQueryClient } from '@tanstack/react-query';
import { cn, formatTokens, formatCost } from '@/lib/utils';
import { useState } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/tasks': 'Task Board',
  '/dashboard/memory': 'Memory',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/team': 'Team',
  '/dashboard/office': 'Digital Office',
  '/dashboard/ops': 'Ops Panel',
};

export function TopBar() {
  const pathname = usePathname();
  const { data: stats } = useStats();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();

  const title = PAGE_TITLES[pathname] ?? 'Mission Control';

  const refresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-bg-border bg-bg-surface flex-shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-muted">mission-control</span>
        <span className="font-mono text-xs text-text-muted">/</span>
        <span className="font-mono text-xs text-text-primary font-medium">{title}</span>
      </div>

      {/* Center: Search */}
      <GlobalSearch />

      {/* Right: system stats + actions */}
      <div className="flex items-center gap-4">
        {/* Live stats */}
        {stats && (
          <div className="hidden lg:flex items-center gap-3 font-mono text-[10px]">
            <div className="flex items-center gap-1 text-text-muted">
              <span className="text-neon-cyan">{stats.active_tasks}</span>
              <span>active</span>
            </div>
            <div className="w-px h-3 bg-bg-border" />
            <div className="flex items-center gap-1 text-text-muted">
              <span className="text-neon-yellow">{formatTokens(stats.total_tokens_today)}</span>
              <span>tokens</span>
            </div>
            <div className="w-px h-3 bg-bg-border" />
            <div className="flex items-center gap-1 text-text-muted">
              <span className="text-neon-green">{formatCost(stats.cost_today_usd)}</span>
              <span>today</span>
            </div>
          </div>
        )}

        {/* Clock */}
        <div className="font-mono text-[10px] text-text-muted hidden md:block">
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </div>

        {/* Refresh */}
        <button
          onClick={refresh}
          className="p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-muted hover:text-text-primary"
          title="Refresh all data"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
        </button>

        {/* Notification bell */}
        <button className="relative p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-muted hover:text-text-primary">
          <Bell className="w-3.5 h-3.5" />
          {(stats?.blocked_tasks ?? 0) > 0 && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-neon-red rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
