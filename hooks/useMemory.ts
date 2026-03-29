'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Memory } from '@/types';

export function useMemories(params?: { type?: string; q?: string; pinned?: boolean }) {
  return useQuery<Memory[]>({
    queryKey: ['memories', params],
    queryFn: async () => {
      const url = new URL('/api/memory', window.location.origin);
      if (params?.type) url.searchParams.set('type', params.type);
      if (params?.q) url.searchParams.set('q', params.q);
      if (params?.pinned) url.searchParams.set('pinned', 'true');
      const res = await fetch(url.toString());
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 30_000,
  });
}

export function useCreateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memory: Partial<Memory>) => {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memory),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
  });
}

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Memory> & { id: string }) => {
      const res = await fetch(`/api/memory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
  });
}
