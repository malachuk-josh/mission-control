'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SSEEvent, SSEEventType } from '@/types';

type Handler<T = unknown> = (event: SSEEvent<T>) => void;

export function useRealtime(handlers?: Partial<Record<SSEEventType, Handler>>) {
  const queryClient = useQueryClient();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const es = new EventSource('/api/stream');

    const eventTypes: SSEEventType[] = [
      'task:created', 'task:updated', 'task:deleted',
      'agent:updated', 'memory:created', 'log:entry', 'stats:updated',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e: MessageEvent) => {
        const event: SSEEvent = JSON.parse(e.data);

        // Invalidate relevant query caches
        if (type.startsWith('task:')) {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
        if (type === 'agent:updated') {
          queryClient.invalidateQueries({ queryKey: ['agents'] });
        }
        if (type === 'memory:created') {
          queryClient.invalidateQueries({ queryKey: ['memories'] });
        }
        if (type === 'log:entry') {
          queryClient.invalidateQueries({ queryKey: ['logs'] });
        }

        // Call custom handler if provided
        const handler = handlersRef.current?.[type];
        if (handler) handler(event);
      });
    }

    es.addEventListener('ping', () => {
      // Connection is alive
    });

    es.onerror = () => {
      // Will auto-reconnect
    };

    return () => {
      es.close();
    };
  }, [queryClient]);
}
