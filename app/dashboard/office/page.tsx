'use client';

import { useState } from 'react';
import { Monitor, Wifi, WifiOff, Activity, Brain, Zap, Clock, X, Coffee } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { cn, avatarColor, initials, formatRelative, formatTokens, statusDot, truncate } from '@/lib/utils';
import type { Agent } from '@/types';

// The agent's desk/workspace visualization
function AgentDesk({
  agent,
  onClick,
  isSelected,
}: {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
}) {
  const color = avatarColor(agent.avatar_seed);
  const isActive = agent.status === 'active';
  const isBlocked = agent.status === 'blocked';
  const isIdle = agent.status === 'idle' || agent.status === 'offline';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 group cursor-pointer',
        'hover:bg-bg-elevated/50',
        isSelected && 'ring-2 ring-offset-2 ring-offset-bg-base',
      )}
      style={isSelected ? { ['--tw-ring-color' as string]: color } : {}}
    >
      {/* Desk surface */}
      <div
        className={cn(
          'relative w-28 h-20 rounded-xl border-2 flex items-end justify-center pb-2 transition-all duration-500',
          isActive && 'monitor-active',
        )}
        style={{
          backgroundColor: color + '0a',
          borderColor: isActive ? color + '60' : isBlocked ? '#f8514920' : '#21262d',
          boxShadow: isActive ? `0 0 20px ${color}15` : 'none',
        }}
      >
        {/* Monitor screen */}
        <div
          className={cn(
            'absolute top-2 left-3 right-3 h-10 rounded-md flex items-center justify-center overflow-hidden',
            'border transition-all duration-300'
          )}
          style={{
            backgroundColor: isActive ? '#0d1117' : '#090c10',
            borderColor: isActive ? color + '50' : '#21262d',
          }}
        >
          {isActive && (
            <div className="w-full h-full p-1 overflow-hidden">
              {/* Fake code lines scrolling */}
              <div className="space-y-0.5 animate-pulse">
                {[80, 60, 90, 45, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-0.5 rounded-full opacity-60"
                    style={{ width: `${w}%`, backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
          {isIdle && (
            <Coffee className="w-4 h-4" style={{ color: '#484f58' }} />
          )}
          {isBlocked && (
            <div className="text-neon-red font-mono text-[8px] font-bold">BLOCKED</div>
          )}
        </div>

        {/* Status indicator light */}
        <div
          className={cn(
            'absolute top-1.5 right-1.5 w-2 h-2 rounded-full',
            isActive && 'animate-pulse',
          )}
          style={{
            backgroundColor: isActive ? '#39d353' : isBlocked ? '#f85149' : '#484f58',
            boxShadow: isActive ? `0 0 6px #39d35380` : 'none',
          }}
        />

        {/* Agent character at desk */}
        <div
          className={cn(
            'relative z-10 w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm',
            'transition-all duration-300'
          )}
          style={{
            backgroundColor: color + '22',
            border: `1.5px solid ${color}44`,
            color,
            transform: isActive ? 'translateY(-1px)' : 'none',
          }}
        >
          {initials(agent.name)}

          {/* Working animation: hands "typing" */}
          {isActive && (
            <div className="absolute -bottom-1.5 left-1 right-1 flex justify-between">
              <div className="w-1.5 h-0.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '0ms' }} />
              <div className="w-1.5 h-0.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '150ms' }} />
            </div>
          )}
        </div>
      </div>

      {/* Name plate */}
      <div className="text-center">
        <div className="font-mono text-xs font-semibold" style={{ color }}>
          {agent.name}
        </div>
        <div className="font-mono text-[9px] text-text-muted">{agent.role.split(' ')[0]}</div>
      </div>

      {/* Activity badge */}
      {isActive && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold border-2 border-bg-base animate-pulse"
          style={{ backgroundColor: '#39d353', color: '#0d1117' }}
        >
          ▶
        </div>
      )}
      {isBlocked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-red border-2 border-bg-base flex items-center justify-center text-[8px] font-bold text-white">
          !
        </div>
      )}
    </button>
  );
}

function AgentWorkspacePanel({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { data: tasks = [] } = useTasks({ owner: agent.id });
  const activeTasks = tasks.filter((t) => t.status === 'in_progress');
  const color = avatarColor(agent.avatar_seed);
  const tokenPct = Math.round((agent.token_used / agent.token_limit) * 100);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-bg-surface border-l border-bg-border shadow-2xl overflow-y-auto">
      {/* Header */}
      <div
        className="px-4 py-4 border-b border-bg-border"
        style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold"
              style={{ backgroundColor: color + '22', border: `1.5px solid ${color}44`, color }}
            >
              {initials(agent.name)}
            </div>
            <div>
              <div className="font-mono text-sm font-semibold" style={{ color }}>{agent.name}</div>
              <div className="font-mono text-[10px] text-text-muted">{agent.role}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', statusDot(agent.status), agent.status === 'active' && 'animate-pulse')} />
          <span className="font-mono text-xs text-text-secondary capitalize">{agent.status}</span>
          <span className="font-mono text-[10px] text-text-muted ml-auto">
            {formatRelative(agent.last_active)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current task */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Current Task
          </div>
          {activeTasks.length > 0 ? (
            <div className="bg-bg-elevated rounded-lg p-3 border border-bg-border">
              <div className="font-mono text-xs text-text-primary font-medium cursor-blink">
                {activeTasks[0].title}
              </div>
              {activeTasks[0].description && (
                <div className="font-mono text-[10px] text-text-muted mt-1">
                  {truncate(activeTasks[0].description, 100)}
                </div>
              )}
            </div>
          ) : (
            <div className="font-mono text-xs text-text-muted italic">No active task</div>
          )}
        </div>

        {/* Memory usage */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Memory Usage
          </div>
          <div className="font-mono text-xs text-text-secondary">
            {tasks.length} tasks in context
          </div>
        </div>

        {/* Token budget */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Token Budget — {tokenPct}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${tokenPct}%`,
                background: tokenPct > 80 ? 'var(--neon-red)' : tokenPct > 60 ? 'var(--neon-yellow)' : color,
              }}
            />
          </div>
          <div className="font-mono text-[10px] text-text-muted mt-1">
            {formatTokens(agent.token_used)} / {formatTokens(agent.token_limit)}
          </div>
        </div>

        {/* Model */}
        <div>
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-1">Model</div>
          <div className="font-mono text-xs" style={{ color }}>{agent.model ?? 'claude-sonnet-4-6'}</div>
        </div>

        {/* Recent outputs */}
        {tasks.length > 0 && (
          <div>
            <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Recent Activity
            </div>
            <div className="space-y-1.5">
              {tasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <span className={cn('w-1 h-1 rounded-full mt-1.5 flex-shrink-0', statusDot(task.status))} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-text-secondary truncate">{task.title}</div>
                    <div className="font-mono text-[9px] text-text-muted">{formatRelative(task.updated_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OfficePage() {
  const { data: agents = [], isLoading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const idleCount = agents.filter((a) => a.status === 'idle').length;
  const blockedCount = agents.filter((a) => a.status === 'blocked').length;

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Floor header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-neon-cyan" />
          <span className="font-mono text-sm font-semibold text-text-primary">Digital Office</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" /><span className="text-neon-green">{activeCount} working</span></span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-text-muted" /><span className="text-text-muted">{idleCount} idle</span></span>
          {blockedCount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-red" /><span className="text-neon-red">{blockedCount} blocked</span></span>}
        </div>
      </div>

      {/* Office floor */}
      <div className="flex-1 overflow-auto p-6">
        {/* Office environment */}
        <div className="relative min-h-full">
          {/* Background: office floor pattern */}
          <div
            className="absolute inset-0 rounded-2xl opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(88, 166, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(88, 166, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Floor label */}
          <div className="relative text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-bg-elevated border border-bg-border rounded-full px-4 py-1.5">
              <Wifi className="w-3 h-3 text-neon-green" />
              <span className="font-mono text-[10px] text-text-muted">CLAUDE AGENT FLOOR · LEVEL 1</span>
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            </div>
          </div>

          {/* Agent desks */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border border-neon-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative flex flex-wrap justify-center gap-8">
              {/* Desk rows */}
              {agents.map((agent) => (
                <AgentDesk
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                />
              ))}
            </div>
          )}

          {/* Office amenities */}
          <div className="mt-12 flex justify-center gap-8 opacity-30">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-6 rounded bg-bg-elevated border border-bg-border" />
              <span className="font-mono text-[8px] text-text-muted">server rack</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-4 rounded-full bg-bg-elevated border border-bg-border" />
              <span className="font-mono text-[8px] text-text-muted">network switch</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-6 rounded bg-bg-elevated border border-bg-border" />
              <span className="font-mono text-[8px] text-text-muted">cooling unit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent workspace panel */}
      {selectedAgent && (
        <AgentWorkspacePanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
}
