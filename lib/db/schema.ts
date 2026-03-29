// SQLite schema definitions

export const SCHEMA_SQL = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner TEXT NOT NULL DEFAULT 'system',
  due_date TEXT,
  memory_id TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  token_cost INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  sort_order INTEGER DEFAULT 0
);

-- Memories
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  agent_id TEXT,
  task_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'note',
  pinned INTEGER NOT NULL DEFAULT 0
);

-- Agents
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  capabilities TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'idle',
  current_task_id TEXT,
  avatar_seed TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_active TEXT NOT NULL,
  token_used INTEGER NOT NULL DEFAULT 0,
  token_limit INTEGER NOT NULL DEFAULT 100000,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  health_score INTEGER NOT NULL DEFAULT 100,
  model TEXT DEFAULT 'claude-sonnet-4-6'
);

-- Scheduled Tasks
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT,
  interval_ms INTEGER,
  next_run TEXT,
  last_run TEXT,
  last_status TEXT DEFAULT 'pending',
  agent_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  run_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'local'
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  recurrence TEXT,
  source TEXT NOT NULL DEFAULT 'local',
  agent_id TEXT,
  task_id TEXT,
  status TEXT DEFAULT 'confirmed'
);

-- Log Entries
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  agent_id TEXT,
  task_id TEXT,
  timestamp TEXT NOT NULL,
  data TEXT DEFAULT '{}'
);

-- Token Usage
CREATE TABLE IF NOT EXISTS token_usage (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  date TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  model TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_agent ON logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(date);
`;

export const SEED_SQL = `
-- Seed Agents
INSERT OR IGNORE INTO agents (id, name, role, capabilities, status, avatar_seed, created_at, last_active, token_used, token_limit, completed_tasks, health_score, model) VALUES
  ('agent-atlas', 'Atlas', 'Research & Analysis', '["web_search","document_analysis","summarization","fact_checking"]', 'active', 'atlas-42', datetime('now'), datetime('now'), 45200, 100000, 23, 97, 'claude-sonnet-4-6'),
  ('agent-hermes', 'Hermes', 'Communication & Drafting', '["email_drafting","scheduling","calendar_management","meeting_prep"]', 'idle', 'hermes-77', datetime('now'), datetime('now','-2 hours'), 12400, 100000, 11, 100, 'claude-haiku-4-5-20251001'),
  ('agent-forge', 'Forge', 'Code & Automation', '["code_generation","debugging","shell_execution","file_management"]', 'active', 'forge-13', datetime('now'), datetime('now'), 88100, 200000, 47, 92, 'claude-opus-4-6'),
  ('agent-iris', 'Iris', 'Memory & Knowledge', '["memory_storage","knowledge_retrieval","tagging","summarization"]', 'idle', 'iris-56', datetime('now'), datetime('now','-1 hour'), 8700, 100000, 18, 100, 'claude-haiku-4-5-20251001'),
  ('agent-nova', 'Nova', 'Planning & Coordination', '["task_planning","dependency_mapping","scheduling","reporting"]', 'blocked', 'nova-29', datetime('now'), datetime('now','-30 minutes'), 31500, 100000, 9, 78, 'claude-sonnet-4-6');

-- Seed Tasks
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, owner, due_date, tags, created_at, updated_at, source) VALUES
  ('task-001', 'Research competitor landscape for Q3 report', 'Analyze top 5 competitors: pricing, features, market positioning', 'in_progress', 'high', 'agent-atlas', date('now', '+3 days'), '["research","q3","competitive"]', datetime('now','-2 days'), datetime('now'), 'manual'),
  ('task-002', 'Draft weekly team update email', 'Summarize this week''s agent activities and milestones', 'backlog', 'medium', 'agent-hermes', date('now', '+1 days'), '["communication","weekly"]', datetime('now','-1 day'), datetime('now','-1 day'), 'scheduled'),
  ('task-003', 'Implement task auto-logging middleware', 'Every agent action should create a visible task entry in the board', 'in_progress', 'critical', 'agent-forge', date('now', '+2 days'), '["dev","infrastructure","logging"]', datetime('now','-3 days'), datetime('now'), 'manual'),
  ('task-004', 'Index and tag all memory entries from last month', 'Process ~200 memory entries, apply consistent taxonomy', 'backlog', 'low', 'agent-iris', date('now', '+7 days'), '["memory","housekeeping"]', datetime('now'), datetime('now'), 'scheduled'),
  ('task-005', 'Q3 planning session — create roadmap doc', 'Synthesize research outputs into actionable Q3 roadmap', 'blocked', 'critical', 'agent-nova', date('now', '+5 days'), '["planning","q3","blocked"]', datetime('now','-1 day'), datetime('now'), 'manual'),
  ('task-006', 'Scrape and summarize latest AI news', 'Daily digest of top AI developments', 'completed', 'medium', 'agent-atlas', date('now'), '["research","daily","ai"]', datetime('now','-1 day'), datetime('now'), 'scheduled'),
  ('task-007', 'Set up Google Calendar sync', 'Connect GCal API, pull recurring events into scheduler', 'completed', 'high', 'agent-forge', date('now','-1 day'), '["integration","calendar"]', datetime('now','-5 days'), datetime('now','-1 day'), 'manual'),
  ('task-008', 'Archive completed tasks from June', 'Move all June completed tasks to archive memory', 'backlog', 'low', 'agent-iris', date('now', '+14 days'), '["housekeeping","archive"]', datetime('now'), datetime('now'), 'manual');

-- Seed Memories
INSERT OR IGNORE INTO memories (id, title, content, tags, agent_id, task_id, created_at, updated_at, type, pinned) VALUES
  ('mem-001', 'Q3 Competitive Analysis — Draft Notes', '## Competitors Identified\n\n### 1. Acme Corp\n- **Pricing**: $49/mo starter, $199/mo pro\n- **Strengths**: Strong brand, enterprise deals\n- **Weaknesses**: Legacy UI, slow releases\n\n### 2. Nexus AI\n- **Pricing**: Usage-based, ~$0.02/task\n- **Strengths**: API-first, developer friendly\n- **Weaknesses**: No consumer product\n\n### Key Insight\nMarket is bifurcating: enterprise legacy players vs. API-native newcomers. Gap in the middle for a prosumer tool with observability.', '["research","competitive","q3"]', 'agent-atlas', 'task-001', datetime('now','-1 day'), datetime('now'), 'research', 1),
  ('mem-002', 'Infrastructure Decision: SQLite for Local Storage', '## Decision Record\n\n**Date**: Today\n**Decided by**: Forge + Nova\n\n### Context\nNeed a local-first storage layer for the Mission Control dashboard that works without network access.\n\n### Decision\nUse SQLite via `better-sqlite3`. Reasons:\n- Zero config, single file\n- WAL mode for concurrent reads\n- Easy to backup/snapshot\n- No external service dependency\n\n### Consequences\n- Limited to single-machine deployment for now\n- Future: can migrate to Turso (SQLite-compatible edge DB)', '["decision","infrastructure","db"]', 'agent-forge', 'task-003', datetime('now','-2 days'), datetime('now','-2 days'), 'decision', 1),
  ('mem-003', 'Daily AI News Digest — Today', '## Top Stories\n\n1. **OpenAI releases GPT-5 preview** — Context window expanded to 2M tokens, new reasoning modes\n2. **Google Gemini Ultra 2** — New multimodal benchmarks released, strong on code\n3. **Anthropic Claude Research** — New interpretability paper on chain-of-thought faithfulness\n4. **EU AI Act compliance deadlines** — GPAI model providers must register by Q4\n\n## Relevance to Our Work\n- Context window expansion means longer research chains are feasible\n- Interpretability work validates our memory architecture approach', '["news","ai","daily"]', 'agent-atlas', 'task-006', datetime('now','-6 hours'), datetime('now','-6 hours'), 'output', 0),
  ('mem-004', 'Agent Capability Registry v1', '## Registered Capabilities\n\nEach agent has a set of declared capabilities used for task routing.\n\n| Agent | Primary Capabilities | Model |\n|-------|---------------------|-------|\n| Atlas | research, analysis, web_search | claude-sonnet-4-6 |\n| Hermes | communication, scheduling | claude-haiku-4-5-20251001 |\n| Forge | coding, automation, shell | claude-opus-4-6 |\n| Iris | memory, retrieval, tagging | claude-haiku-4-5-20251001 |\n| Nova | planning, coordination | claude-sonnet-4-6 |\n\n## Routing Logic\nTasks tagged with `[research]` → Atlas\nTasks tagged with `[dev]` → Forge\nTasks tagged with `[planning]` → Nova', '["agents","capabilities","registry"]', 'agent-iris', NULL, datetime('now','-3 days'), datetime('now','-1 day'), 'note', 1),
  ('mem-005', 'Weekly Ops Log — This Week', '## Week Summary\n\n**Tasks Completed**: 14\n**Tasks Created**: 22\n**Blocked Tasks Resolved**: 3\n\n### Agent Performance\n- Atlas: 97% health, 23 tasks done, 45k tokens\n- Forge: 92% health, 47 tasks done, 88k tokens (heaviest load)\n- Hermes: 100% health, 11 tasks done, 12k tokens\n\n### Issues\n- Nova blocked on Q3 roadmap (waiting for Atlas research)\n- Token budget at 60% for the month\n\n### Actions\n- Increase Forge token limit to 200k (done)\n- Unblock Nova once task-001 completes', '["ops","weekly","logs"]', 'agent-nova', NULL, datetime('now','-1 day'), datetime('now'), 'log', 0);

-- Seed Scheduled Tasks
INSERT OR IGNORE INTO scheduled_tasks (id, name, description, cron_expression, next_run, last_run, last_status, agent_id, enabled, run_count, error_count, created_at, source) VALUES
  ('sched-001', 'Daily AI News Digest', 'Scrape and summarize top AI news every morning', '0 8 * * *', datetime('now', '+16 hours'), datetime('now', '-8 hours'), 'success', 'agent-atlas', 1, 47, 1, datetime('now', '-47 days'), 'local'),
  ('sched-002', 'Weekly Team Update Email', 'Draft and send weekly summary every Monday 9am', '0 9 * * 1', datetime('now', '+2 days'), datetime('now', '-5 days'), 'success', 'agent-hermes', 1, 12, 0, datetime('now', '-84 days'), 'local'),
  ('sched-003', 'Memory Indexing Job', 'Tag and index all new memory entries nightly', '0 0 * * *', datetime('now', '+8 hours'), datetime('now', '-16 hours'), 'success', 'agent-iris', 1, 47, 3, datetime('now', '-47 days'), 'local'),
  ('sched-004', 'Google Calendar Sync', 'Pull latest events from Google Calendar every 30min', NULL, datetime('now', '+30 minutes'), datetime('now', '-5 minutes'), 'success', 'agent-forge', 1, 1842, 12, datetime('now', '-64 days'), 'google'),
  ('sched-005', 'Health Check Ping', 'Check all service health endpoints every 5 minutes', NULL, datetime('now', '+5 minutes'), datetime('now', '-1 minutes'), 'success', NULL, 1, 8431, 7, datetime('now', '-30 days'), 'local'),
  ('sched-006', 'Monthly Archive Sweep', 'Archive completed tasks older than 30 days', '0 0 1 * *', datetime('now', '+22 days'), datetime('now', '-8 days'), 'success', 'agent-iris', 1, 3, 0, datetime('now', '-95 days'), 'local');

-- Seed Logs
INSERT OR IGNORE INTO logs (id, level, message, agent_id, task_id, timestamp, data) VALUES
  ('log-001', 'success', 'Task task-007 marked completed: Google Calendar sync set up', 'agent-forge', 'task-007', datetime('now','-1 day'), '{"tokens":4200}'),
  ('log-002', 'info', 'Scheduled task sched-001 started: Daily AI News Digest', 'agent-atlas', NULL, datetime('now','-8 hours'), '{}'),
  ('log-003', 'success', 'Memory mem-003 created from task output', 'agent-atlas', 'task-006', datetime('now','-6 hours'), '{"size_bytes":1240}'),
  ('log-004', 'warn', 'Agent Nova blocked: dependency on task-001 not yet resolved', 'agent-nova', 'task-005', datetime('now','-30 minutes'), '{"blocking_task":"task-001"}'),
  ('log-005', 'info', 'Real-time SSE stream connected: 1 subscriber', NULL, NULL, datetime('now','-5 minutes'), '{}'),
  ('log-006', 'success', 'Health check passed: all services nominal', NULL, NULL, datetime('now','-1 minute'), '{"services":5}'),
  ('log-007', 'error', 'Gmail API rate limit hit — retrying in 60s', 'agent-hermes', NULL, datetime('now','-3 hours'), '{"retry_after":60}'),
  ('log-008', 'info', 'Task task-003 progress update: 65% complete', 'agent-forge', 'task-003', datetime('now','-20 minutes'), '{"progress":65}');

-- Seed Token Usage
INSERT OR IGNORE INTO token_usage (id, agent_id, date, input_tokens, output_tokens, cost_usd, model) VALUES
  ('tu-001', 'agent-atlas', date('now'), 28000, 17200, 0.42, 'claude-sonnet-4-6'),
  ('tu-002', 'agent-forge', date('now'), 51000, 37100, 1.84, 'claude-opus-4-6'),
  ('tu-003', 'agent-hermes', date('now'), 8200, 4200, 0.06, 'claude-haiku-4-5-20251001'),
  ('tu-004', 'agent-iris', date('now'), 5400, 3300, 0.04, 'claude-haiku-4-5-20251001'),
  ('tu-005', 'agent-nova', date('now'), 19000, 12500, 0.27, 'claude-sonnet-4-6');
`;
