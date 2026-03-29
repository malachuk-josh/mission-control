'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Brain, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/types';

const TYPE_ICONS = {
  task: FileText,
  memory: Brain,
  agent: User,
  event: Calendar,
};

const TYPE_COLORS = {
  task: 'text-neon-cyan',
  memory: 'text-neon-purple',
  agent: 'text-neon-green',
  event: 'text-neon-yellow',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd/Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.data ?? []);
      setSelected(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  const navigate = (result: SearchResult) => {
    router.push(result.url);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected]);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-elevated border border-bg-border text-text-muted hover:text-text-primary hover:border-bg-hover transition-all font-mono text-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 text-[9px] bg-bg-base px-1 rounded border border-bg-border">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-4 bg-bg-surface border border-bg-border rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search tasks, memories, agents..."
            className="flex-1 bg-transparent font-mono text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border border-neon-cyan border-t-transparent rounded-full animate-spin" />
          )}
          <button onClick={() => setOpen(false)}>
            <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const Icon = TYPE_ICONS[r.type] ?? FileText;
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(r)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                    i === selected ? 'bg-bg-elevated' : 'hover:bg-bg-elevated/50'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', TYPE_COLORS[r.type])} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-text-primary truncate">{r.title}</div>
                    {r.excerpt && (
                      <div className="font-mono text-xs text-text-muted truncate mt-0.5">{r.excerpt}</div>
                    )}
                  </div>
                  {r.meta && (
                    <span className="text-[10px] font-mono text-text-muted bg-bg-base px-1.5 py-0.5 rounded flex-shrink-0">
                      {r.meta}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div className="px-4 py-6 text-center font-mono text-sm text-text-muted">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        <div className="px-4 py-2 border-t border-bg-border flex gap-4 font-mono text-[10px] text-text-muted">
          <span><kbd className="bg-bg-base border border-bg-border px-1 rounded text-[9px]">↑↓</kbd> Navigate</span>
          <span><kbd className="bg-bg-base border border-bg-border px-1 rounded text-[9px]">↵</kbd> Open</span>
          <span><kbd className="bg-bg-base border border-bg-border px-1 rounded text-[9px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
