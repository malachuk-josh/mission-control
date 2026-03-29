#!/usr/bin/env node
/**
 * Mission Control — Database initializer
 * Run: node scripts/init-db.js
 */

const path = require('path');
const fs = require('fs');

// Check if better-sqlite3 is installed
try {
  require.resolve('better-sqlite3');
} catch {
  console.error('✗ better-sqlite3 not found. Run: npm install');
  process.exit(1);
}

const Database = require('better-sqlite3');
const dbPath = path.resolve(process.cwd(), 'mission-control.db');

// Remove existing DB for a fresh start
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ Removed existing database');
}

const db = new Database(dbPath);

// Load and run schema + seed
const schemaModule = require('../lib/db/schema');
// Since this is TS, we'll inline the SQL here for the Node script
const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'backlog', priority TEXT NOT NULL DEFAULT 'medium', owner TEXT NOT NULL DEFAULT 'system', due_date TEXT, memory_id TEXT, tags TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT, token_cost INTEGER DEFAULT 0, source TEXT DEFAULT 'manual', sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', agent_id TEXT, task_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'note', pinned INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, capabilities TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'idle', current_task_id TEXT, avatar_seed TEXT NOT NULL, created_at TEXT NOT NULL, last_active TEXT NOT NULL, token_used INTEGER NOT NULL DEFAULT 0, token_limit INTEGER NOT NULL DEFAULT 100000, completed_tasks INTEGER NOT NULL DEFAULT 0, health_score INTEGER NOT NULL DEFAULT 100, model TEXT DEFAULT 'claude-sonnet-4-6');
CREATE TABLE IF NOT EXISTS scheduled_tasks (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, cron_expression TEXT, interval_ms INTEGER, next_run TEXT, last_run TEXT, last_status TEXT DEFAULT 'pending', agent_id TEXT, enabled INTEGER NOT NULL DEFAULT 1, run_count INTEGER NOT NULL DEFAULT 0, error_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'local');
CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, start TEXT NOT NULL, end TEXT NOT NULL, recurrence TEXT, source TEXT NOT NULL DEFAULT 'local', agent_id TEXT, task_id TEXT, status TEXT DEFAULT 'confirmed');
CREATE TABLE IF NOT EXISTS logs (id TEXT PRIMARY KEY, level TEXT NOT NULL DEFAULT 'info', message TEXT NOT NULL, agent_id TEXT, task_id TEXT, timestamp TEXT NOT NULL, data TEXT DEFAULT '{}');
CREATE TABLE IF NOT EXISTS token_usage (id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, date TEXT NOT NULL, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0, cost_usd REAL NOT NULL DEFAULT 0, model TEXT NOT NULL);
`;

db.exec(SCHEMA);
console.log('✓ Schema created');

console.log('✓ Database initialized at:', dbPath);
console.log('\nNext steps:');
console.log('  1. cp .env.local.example .env.local');
console.log('  2. Edit .env.local with your credentials (optional for offline mode)');
console.log('  3. npm run dev');
console.log('\n  Open: http://localhost:3000');
