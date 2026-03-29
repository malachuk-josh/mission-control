'use client';

import { useState } from 'react';
import { Cpu, Zap, CheckCircle, BarChart3, Clock, Shield, ChevronRight } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { cn, statusColor, statusDot, formatRelative, formatTokens, avatarColor, initials } from '@/lib/utils';
import type { Agent } from '@/types';

function AgentAvatar({ agent, size = 'md' }: { agent: Agent; size?: 'sm' | 'md' | 'lg' }) {
  const color = avatarColor(agent.avatar_seed);
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };

  return (
    <div className="relative">
      <div
        className={cn('rounded-xl flex items-center justify-center font-mono font-bold flex-shrink-0', sizeClasses[size])}
        style={{ backgroundColor: color + '22', border: `1.5px solid ${color}44`, color }}
      >
        {initials(agent.name)}
      </div>
      <span className={cn(
        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-surface',
        statusDot(agent.status),
        agent.status === 'active' && 'animate-pulse'
      )} />
    </div>
  );
}

function CapabilityBadge({ cap }: { cap: string }) {
  return (
    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-bg-base border border-bg-border text-text-muted">
      {cap.replace(/_/g, ' ')}
    </span>
  );
}

function AgentDetailPanel({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { data: tasks = [] } = useTasks({ owner: agent.id });
  const activeTasks = tasks.filter((t) => t.status === 'in_progress');
  const recentTasks = tasks.slice(0, 5);
  const tokenPct = Math.round((agent.token_used / agent.token_limit) * 100);

  return (
    <div className="h-full flex flex-col bg-bg-surface border-l border-bg-border overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-bg-border">
        <AgentAvatar agent={agent} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-base font-semibold text-text-primary">{agent.name}</div>
          <div className="font-mono text-xs text-text-muted">{agent.role}</div>
          <div className={cn('font-mono text-xs mt-0.5', statusColor(agent.status))}>
            ● {agent.status}
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">✕</button>
      </div>

      <div className="p-4 space-y-5">
        {/* Model */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-1">Model</div>
          <div className="font-mono text-xs text-neon-cyan">{agent.model ?? 'claude-sonnet-4-6'}</div>
        </div>

        {/* Health */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Health Score
          </div>
          <div className="flex items-center gap-2">
            <div className="progress-bar flex-1">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${agent.health_score}%`,
                  background: agent.health_score > 80 ? 'var(--neon-green)' : agent.health_score > 50 ? 'var(--neon-yellow)' : 'var(--neon-red)',
                }}
              />
            </div>
            <span className="font-mono text-xs text-text-secondary w-8 text-right">{agent.health_score}%</span>
          </div>
        </div>

        {/* Token usage */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Token Budget
          </div>
          <div className="flex items-center gap-2">
            <div className="progress-bar flex-1">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${tokenPct}%`,
                  background: tokenPct > 80 ? 'var(--neon-red)' : tokenPct > 60 ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
                }}
              />
            </div>
            <span className="font-mono text-xs text-text-secondary">
              {formatTokens(agent.token_used)}/{formatTokens(agent.token_limit)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-elevated rounded-lg p-3">
            <div className="font-mono text-[9px] text-text-muted mb-1">Tasks Done</div>
            <div className="font-mono text-lg text-neon-green">{agent.completed_tasks}</div>
          </div>
          <div className="bg-bg-elevated rounded-lg p-3">
            <div className="font-mono text-[9px] text-text-muted mb-1">Active</div>
            <div className="font-mono text-lg text-neon-cyan">{activeTasks.length}</div>
          </div>
        </div>

        {/* Last active */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last Active
          </div>
          <div className="font-mono text-xs text-text-secondary">{formatRelative(agent.last_active)}</div>
        </div>

        {/* Capabilities */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-2">Capabilities</div>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities?.map((cap) => <CapabilityBadge key={cap} cap={cap} />)}
          </div>
        </div>

        {/* Recent tasks */}
        {recentTasks.length > 0 && (
          <div>
            <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-2">Recent Tasks</div>
            <div className="space-y-1.5">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 py-1">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', statusDot(task.status))} />
                  <span className="font-mono text-[10px] text-text-secondary truncate flex-1">{task.title}</span>
                  <span className="font-mono text-[9px] text-text-muted">{formatRelative(task.updated_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, onClick, selected }: { agent: Agent; onClick: () => void; selected: boolean }) {
  const tokenPct = Math.round((agent.token_used / agent.token_limit) * 100);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-bg-surface border rounded-xl p-4 transition-all hover:border-bg-hover',
        selected ? 'border-neon-cyan shadow-neon-cyan' : 'border-bg-border'
      )}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar agent={agent} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm text-text-primary font-medium">{agent.name}</span>
            <span className={cn('font-mono text-[9px] px-1.5 py-0.5 rounded uppercase border', statusColor(agent.status), 'border-current/20 bg-current/5')}>
              {agent.status}
            </span>
          </div>
          <div className="font-mono text-xs text-text-muted mt-0.5">{agent.role}</div>

          {/* Token bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="progress-bar flex-1 h-1">
              <div
                className="h-full rounded"
                style={{
                  width: `${tokenPct}%`,
                  background: tokenPct > 80 ? 'var(--neon-red)' : tokenPct > 60 ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span className="font-mono text-[9px] text-text-muted">{tokenPct}%</span>
          </div>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-text-muted flex-shrink-0 mt-2', selected && 'text-neon-cyan')} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-bg-border">
        <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
          <CheckCircle className="w-3 h-3 text-neon-green" />
          <span>{agent.completed_tasks} done</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
          <Zap className="w-3 h-3 text-neon-yellow" />
          <span>{formatTokens(agent.token_used)}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
          <BarChart3 className="w-3 h-3 text-neon-purple" />
          <span>{agent.health_score}%</span>
        </div>
      </div>
    </button>
  );
}

export default function TeamPage() {
  const { data: agents = [], isLoading } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAgent = agents.find((a) => a.id === selectedId);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-text-primary">Agent Network</h2>
          <span className="font-mono text-[10px] text-text-muted">
            {agents.filter((a) => a.status === 'active').length} active / {agents.length} total
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border border-neon-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedId === agent.id}
                onClick={() => setSelectedId(selectedId === agent.id ? null : agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedAgent && (
        <div className="w-80 flex-shrink-0">
          <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
