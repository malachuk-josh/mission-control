'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardStats } from '@/types';

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/ops?section=stats');
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 20_000,
  });
}
