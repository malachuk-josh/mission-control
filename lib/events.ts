// Simple in-process event emitter for SSE broadcasting
import { EventEmitter } from 'events';
import type { SSEEvent, SSEEventType } from '@/types';

class MissionControlEmitter extends EventEmitter {
  private static instance: MissionControlEmitter;

  static getInstance(): MissionControlEmitter {
    if (!MissionControlEmitter.instance) {
      MissionControlEmitter.instance = new MissionControlEmitter();
      MissionControlEmitter.instance.setMaxListeners(100);
    }
    return MissionControlEmitter.instance;
  }

  broadcast<T>(type: SSEEventType, data: T) {
    const event: SSEEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit('event', event);
  }
}

export const emitter = MissionControlEmitter.getInstance();

// Helper to emit from API routes
export function broadcastEvent<T>(type: SSEEventType, data: T) {
  emitter.broadcast(type, data);
}
