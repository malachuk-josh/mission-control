'use client';

import { useQuery } from '@tanstack/react-query';
import type { Agent } from '@/types';

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 15_000,
  });
}

export function useAgent(id: string) {
  const { data: agents, ...rest } = useAgents();
  return {
    ...rest,
    data: agents?.find((a) => a.id === id),
  };
}
