'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Server, Zap, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Terminal,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { cn, statusColor, formatRelative, formatTokens, formatCost } from '@/lib/utils';
import type { ServiceHealth, LogEntry, TokenUsage, DashboardStats } from '@/types';

function useOpsData(section: string) {
  return useQuery({
    queryKey: ['ops', section],
    queryFn: async () => {
      const res = await fetch(`/api/ops?section=${section}`);
      const json = await res.json();
      return json.data;
    },
    refetchInterval: section === 'logs' ? 5_000 : 20_000,
  });
}

const LOG_LEVEL_CLASSES: Record<string, string> = {
  info: 'text-text-secondary',
  success: 'text-neon-green',
  warn: 'text-neon-yellow',
  error: 'text-neon-red',
  debug: 'text-neon-purple',
};

const LOG_LEVEL_PREFIXES: Record<string, string> = {
  info: '[INFO ]',
  success: '[OK   ]',
  warn: '[WARN ]',
  error: '[ERROR]',
  debug: '[DEBUG]',
};

function ServiceHealthCard({ service }: { service: ServiceHealth }) {
  const StatusIcon = service.status === 'healthy' ? CheckCircle
    : service.status === 'down' ? XCircle
    : service.status === 'degraded' ? AlertTriangle
    : Clock;

  return (
    <div className={cn(
      'bg-bg-surface border rounded-lg p-4 transition-all',
      service.status === 'healthy' ? 'border-neon-green/20' :
      service.status === 'down' ? 'border-neon-red/30' :
      service.status === 'degraded' ? 'border-neon-yellow/20' :
      'border-bg-border'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-text-muted" />
          <span className="font-mono text-xs text-text-primary">{service.service}</span>
        </div>
        <div className={cn('flex items-center gap-1', statusColor(service.status))}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="font-mono text-[10px] uppercase">{service.status}</span>
        </div>
      </div>
      {service.message && (
        <div className="font-mono text-[10px] text-text-muted">{service.message}</div>
      )}
      {service.latency_ms !== undefined && (
        <div className="font-mono text-[10px] text-text-muted mt-1">
          Latency: <span className="text-neon-cyan">{service.latency_ms}ms</span>
        </div>
      )}
      <div className="font-mono text-[9px] text-text-muted mt-1.5">
        {formatRelative(service.last_checked)}
      </div>
    </div>
  );
}

function LogStream({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div
      className="bg-bg-base border border-bg-border rounded-lg font-mono text-[11px] h-64 overflow-y-auto p-3 space-y-0.5"
      onScroll={(e) => {
        const el = e.currentTarget;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
        setAutoScroll(atBottom);
      }}
    >
      {logs.map((log) => (
        <div key={log.id} className="flex gap-2 hover:bg-bg-elevated px-1 rounded">
          <span className="text-text-muted flex-shrink-0 w-20 truncate">
            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className={cn('flex-shrink-0 w-16', LOG_LEVEL_CLASSES[log.level])}>
            {LOG_LEVEL_PREFIXES[log.level] ?? '[INFO ]'}
          </span>
          {log.agent_id && (
            <span className="text-neon-purple flex-shrink-0">[{log.agent_id.replace('agent-', '')}]</span>
          )}
          <span className={cn(LOG_LEVEL_CLASSES[log.level], 'flex-1')}>{log.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// Generate chart data from token usage
function makeChartData(usage: TokenUsage[]) {
  return usage.map((u) => ({
    name: u.agent_id.replace('agent-', ''),
    tokens: u.input_tokens + u.output_tokens,
    cost: parseFloat(u.cost_usd.toFixed(3)),
  }));
}

export default function OpsPage() {
  const { data: health = [] } = useOpsData('health') as { data: ServiceHealth[] };
  const { data: logs = [] } = useOpsData('logs') as { data: LogEntry[] };
  const { data: tokens = [] } = useOpsData('tokens') as { data: TokenUsage[] };
  const { data: stats } = useOpsData('stats') as { data: DashboardStats };

  const chartData = makeChartData(tokens);
  const totalCost = tokens.reduce((s, t) => s + t.cost_usd, 0);
  const totalTokens = tokens.reduce((s, t) => s + t.input_tokens + t.output_tokens, 0);

  const healthyCount = health.filter((h) => h.status === 'healthy').length;
  const downCount = health.filter((h) => h.status === 'down').length;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* System Status Banner */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border font-mono text-sm',
        downCount > 0
          ? 'bg-red-950/20 border-neon-red/30 text-neon-red'
          : 'bg-neon-green/5 border-neon-green/20 text-neon-green'
      )}>
        <Activity className={cn('w-4 h-4', downCount > 0 && 'animate-pulse')} />
        <span>
          {downCount > 0
            ? `⚠ ${downCount} service(s) down — investigate immediately`
            : `✓ All ${healthyCount} services nominal — system healthy`}
        </span>
        <span className="ml-auto text-[10px] text-text-muted">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Tasks', value: stats.active_tasks, color: 'text-neon-cyan', icon: Activity },
            { label: 'Completed Today', value: stats.completed_today, color: 'text-neon-green', icon: CheckCircle },
            { label: 'Tokens Today', value: formatTokens(stats.total_tokens_today), color: 'text-neon-yellow', icon: Zap },
            { label: 'Cost Today', value: formatCost(stats.cost_today_usd), color: 'text-neon-orange', icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-bg-surface border border-bg-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={cn('w-3.5 h-3.5', color)} />
                <span className="font-mono text-[9px] text-text-muted uppercase">{label}</span>
              </div>
              <div className={cn('font-mono text-xl font-bold', color)}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Service Health */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-text-muted" />
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">Service Health</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {health.map((svc) => <ServiceHealthCard key={svc.service} service={svc} />)}
        </div>
      </section>

      {/* Token Usage Chart */}
      {chartData.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-yellow" />
              <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">Token Usage — Today</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="text-text-muted">Total: <span className="text-neon-yellow">{formatTokens(totalTokens)}</span></span>
              <span className="text-text-muted">Cost: <span className="text-neon-orange">{formatCost(totalCost)}</span></span>
            </div>
          </div>
          <div className="bg-bg-surface border border-bg-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#8b949e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#8b949e' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatTokens(v)} />
                <Tooltip
                  contentStyle={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }}
                  labelStyle={{ color: '#e6edf3' }}
                  formatter={(value: number) => [formatTokens(value), 'tokens']}
                />
                <Area type="monotone" dataKey="tokens" stroke="#58a6ff" fill="url(#tokenGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Per-agent breakdown */}
            <div className="mt-3 space-y-2">
              {tokens.map((t) => {
                const pct = totalTokens > 0 ? Math.round(((t.input_tokens + t.output_tokens) / totalTokens) * 100) : 0;
                return (
                  <div key={t.agent_id} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-text-muted w-14 flex-shrink-0">{t.agent_id.replace('agent-', '')}</span>
                    <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-text-secondary w-12 text-right">{formatTokens(t.input_tokens + t.output_tokens)}</span>
                    <span className="font-mono text-[10px] text-neon-yellow w-10 text-right">{formatCost(t.cost_usd)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Log Stream */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-neon-green" />
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">System Log</span>
          <span className="font-mono text-[9px] text-neon-green bg-neon-green/10 border border-neon-green/20 px-1.5 py-0.5 rounded">LIVE</span>
        </div>
        <LogStream logs={logs} />
      </section>
    </div>
  );
}
