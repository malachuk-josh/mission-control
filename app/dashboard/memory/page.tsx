'use client';

import { useState } from 'react';
import { Search, Plus, Pin, PinOff, Brain, FileText, FlaskConical, Lightbulb, ScrollText, Filter } from 'lucide-react';
import { useMemories, useCreateMemory, useUpdateMemory } from '@/hooks/useMemory';
import { cn, formatRelative, truncate } from '@/lib/utils';
import type { Memory } from '@/types';

const TYPE_META: Record<string, { icon: React.FC<{ className?: string }>; color: string; label: string }> = {
  note:     { icon: FileText,     color: 'text-text-secondary',  label: 'Note' },
  output:   { icon: ScrollText,   color: 'text-neon-cyan',       label: 'Output' },
  research: { icon: FlaskConical, color: 'text-neon-purple',     label: 'Research' },
  decision: { icon: Lightbulb,    color: 'text-neon-yellow',     label: 'Decision' },
  log:      { icon: Brain,        color: 'text-neon-green',      label: 'Log' },
};

function MemoryDocument({ memory, onPin }: { memory: Memory; onPin: (m: Memory) => void }) {
  const meta = TYPE_META[memory.type] ?? TYPE_META.note;
  const Icon = meta.icon;

  const renderContent = (content: string) => {
    // Simple markdown-ish rendering
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="font-mono text-sm font-semibold text-text-primary mt-4 mb-2 pb-1 border-b border-bg-border">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="font-mono text-xs font-semibold text-text-secondary mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <div key={i} className="font-mono text-xs text-text-secondary flex gap-2 mb-1"><span className="text-neon-cyan flex-shrink-0">›</span><span>{line.slice(2)}</span></div>;
        if (line.startsWith('**') && line.endsWith('**')) return <div key={i} className="font-mono text-xs text-text-primary font-semibold mb-1">{line.slice(2, -2)}</div>;
        if (line === '') return <div key={i} className="h-2" />;
        return <p key={i} className="font-mono text-xs text-text-secondary mb-1 leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl overflow-hidden hover:border-bg-hover transition-all">
      {/* Document header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('w-4 h-4 flex-shrink-0', meta.color)} />
          <span className="font-mono text-sm text-text-primary font-medium truncate">{memory.title}</span>
          {memory.pinned && <Pin className="w-3 h-3 text-neon-yellow flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('font-mono text-[9px] px-1.5 py-0.5 rounded border', meta.color, 'border-current/20 bg-current/5')}>
            {meta.label}
          </span>
          <button
            onClick={() => onPin(memory)}
            className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-neon-yellow transition-colors"
          >
            {memory.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-64 overflow-y-auto">
        <div className="markdown-body">
          {renderContent(memory.content)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-bg-border bg-bg-base/30">
        <span className="font-mono text-[9px] text-text-muted">{formatRelative(memory.updated_at)}</span>
        {memory.agent_id && (
          <span className="font-mono text-[9px] text-text-muted">via {memory.agent_id.replace('agent-', '')}</span>
        )}
        <div className="flex gap-1 ml-auto flex-wrap">
          {memory.tags?.slice(0, 4).map((tag) => (
            <span key={tag} className="font-mono text-[9px] text-text-muted bg-bg-elevated px-1 rounded">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', content: '', type: 'note', tags: '' });

  const { data: memories = [], isLoading } = useMemories({
    q: search || undefined,
    type: typeFilter || undefined,
  });

  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();

  const handlePin = async (memory: Memory) => {
    await updateMemory.mutateAsync({ id: memory.id, pinned: !memory.pinned });
  };

  const handleCreate = async () => {
    if (!newForm.title.trim() || !newForm.content.trim()) return;
    await createMemory.mutateAsync({
      title: newForm.title,
      content: newForm.content,
      type: newForm.type as Memory['type'],
      tags: newForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setShowNew(false);
    setNewForm({ title: '', content: '', type: 'note', tags: '' });
  };

  const pinned = memories.filter((m) => m.pinned);
  const unpinned = memories.filter((m) => !m.pinned);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 bg-transparent font-mono text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="font-mono text-xs bg-bg-elevated border border-bg-border rounded px-2 py-1 text-text-secondary outline-none"
          >
            <option value="">All types</option>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Memory
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border border-neon-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {pinned.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-3.5 h-3.5 text-neon-yellow" />
              <span className="font-mono text-xs text-neon-yellow uppercase tracking-wider">Pinned</span>
            </div>
            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
              {pinned.map((m) => <MemoryDocument key={m.id} memory={m} onPin={handlePin} />)}
            </div>
          </section>
        )}

        {unpinned.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-3.5 h-3.5 text-text-muted" />
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                {pinned.length > 0 ? 'All Memories' : 'Memories'} ({unpinned.length})
              </span>
            </div>
            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
              {unpinned.map((m) => <MemoryDocument key={m.id} memory={m} onPin={handlePin} />)}
            </div>
          </section>
        )}

        {!isLoading && memories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Brain className="w-8 h-8 text-text-muted" />
            <span className="font-mono text-sm text-text-muted">No memories found</span>
            <button onClick={() => setShowNew(true)} className="font-mono text-xs text-neon-cyan hover:underline">
              Create your first memory →
            </button>
          </div>
        )}
      </div>

      {/* New memory modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-bg-surface border border-bg-border rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
              <span className="font-mono text-sm text-text-primary">New Memory</span>
              <button onClick={() => setShowNew(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <input
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                placeholder="Title"
                className="w-full font-mono text-sm bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary outline-none focus:border-neon-cyan"
              />
              <div className="flex gap-3">
                <select
                  value={newForm.type}
                  onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                  className="font-mono text-xs bg-bg-elevated border border-bg-border rounded px-2 py-2 text-text-secondary outline-none"
                >
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <input
                  value={newForm.tags}
                  onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                  placeholder="Tags (comma separated)"
                  className="flex-1 font-mono text-xs bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary outline-none focus:border-neon-cyan"
                />
              </div>
              <textarea
                value={newForm.content}
                onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
                placeholder="Content (supports markdown)"
                rows={8}
                className="w-full font-mono text-xs bg-bg-elevated border border-bg-border rounded px-3 py-2 text-text-primary outline-none focus:border-neon-cyan resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNew(false)} className="font-mono text-xs px-3 py-1.5 rounded bg-bg-elevated text-text-secondary">Cancel</button>
                <button onClick={handleCreate} className="font-mono text-xs px-3 py-1.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20">
                  Save Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
