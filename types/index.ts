// ─── Core Domain Types ────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type AgentStatus = 'active' | 'idle' | 'blocked' | 'offline';
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: string; // agent id
  due_date?: string; // ISO string
  memory_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  token_cost?: number;
  source?: string; // 'manual' | 'agent' | 'scheduled'
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  agent_id?: string;
  task_id?: string;
  created_at: string;
  updated_at: string;
  type: 'note' | 'output' | 'research' | 'decision' | 'log';
  pinned: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: AgentStatus;
  current_task_id?: string;
  avatar_seed: string; // used to generate consistent avatar
  created_at: string;
  last_active: string;
  token_used: number;
  token_limit: number;
  completed_tasks: number;
  health_score: number; // 0-100
  model?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  cron_expression?: string;
  interval_ms?: number;
  next_run?: string;
  last_run?: string;
  last_status?: 'success' | 'failure' | 'running' | 'pending';
  agent_id?: string;
  enabled: boolean;
  run_count: number;
  error_count: number;
  created_at: string;
  source: 'local' | 'claude' | 'google';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  recurrence?: string;
  source: 'google' | 'local' | 'scheduled';
  agent_id?: string;
  task_id?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  agent_id?: string;
  task_id?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface ServiceHealth {
  service: string;
  status: ServiceStatus;
  latency_ms?: number;
  last_checked: string;
  message?: string;
}

export interface TokenUsage {
  agent_id: string;
  date: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model: string;
}

export interface DashboardStats {
  total_tasks: number;
  active_tasks: number;
  blocked_tasks: number;
  completed_today: number;
  active_agents: number;
  total_tokens_today: number;
  cost_today_usd: number;
  system_health: 'healthy' | 'degraded' | 'critical';
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

export type SSEEventType =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'agent:updated'
  | 'memory:created'
  | 'log:entry'
  | 'stats:updated'
  | 'ping';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchResult {
  type: 'task' | 'memory' | 'agent' | 'event';
  id: string;
  title: string;
  excerpt?: string;
  meta?: string;
  url: string;
}
