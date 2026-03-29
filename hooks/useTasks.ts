'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskStatus } from '@/types';

async function fetchTasks(params?: { status?: string; owner?: string; q?: string }): Promise<Task[]> {
  const url = new URL('/api/tasks', window.location.origin);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.owner) url.searchParams.set('owner', params.owner);
  if (params?.q) url.searchParams.set('q', params.q);
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data ?? [];
}

export function useTasks(params?: { status?: string; owner?: string; q?: string }) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => fetchTasks(params),
    refetchInterval: 30_000,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
