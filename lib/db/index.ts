/**
 * Database layer — Turso (LibSQL) async client
 *
 * Local dev:  uses a local SQLite file (no Turso account needed)
 * Production: uses TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars
 *
 * Set TURSO_DATABASE_URL=file:./mission-control.db for local-only mode.
 */

import { createClient, type Client, type ResultSet } from '@libsql/client';
import { SCHEMA_SQL, SEED_SQL } from './schema';

let _db: Client | null = null;
let _initialized = false;
let _initPromise: Promise<void> | null = null;

export function getDb(): Client {
  if (_db) return _db;

  const url =
    process.env.TURSO_DATABASE_URL ??
    'file:./mission-control.db';

  const authToken = process.env.TURSO_AUTH_TOKEN;

  _db = createClient(authToken ? { url, authToken } : { url });
  return _db;
}

// Convert a LibSQL ResultSet row to a plain JS object
function resultToObjects<T>(result: ResultSet): T[] {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of result.columns) {
      const val = row[col];
      // Convert BigInt → number for JSON serialisation
      obj[col] = typeof val === 'bigint' ? Number(val) : val;
    }
    return obj as T;
  });
}

// One-time schema init + optional seed
async function ensureInitialized(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const db = getDb();

    // Execute schema statements one by one (PRAGMAs are best-effort)
    const stmts = SCHEMA_SQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 4);

    for (const sql of stmts) {
      try {
        await db.execute(sql);
      } catch {
        // Silently ignore PRAGMA failures on remote Turso
      }
    }

    // Seed only if empty
    const countResult = await db.execute('SELECT COUNT(*) as c FROM tasks');
    const count = Number(
      countResult.rows[0]?.['c'] ?? countResult.rows[0]?.[0] ?? 0
    );

    if (count === 0) {
      const seedStmts = SEED_SQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 4);

      for (const sql of seedStmts) {
        try {
          await db.execute(sql);
        } catch (err) {
          console.error('[DB seed error]', sql.slice(0, 60), err);
        }
      }
    }

    _initialized = true;
  })();

  return _initPromise;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export async function dbQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureInitialized();
  const result = await getDb().execute({ sql, args: params as never[] });
  return resultToObjects<T>(result);
}

export async function dbGet<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await dbQuery<T>(sql, params);
  return rows[0];
}

export async function dbRun(sql: string, params: unknown[] = []) {
  await ensureInitialized();
  return getDb().execute({ sql, args: params as never[] });
}

export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function stringifyJsonField(value: unknown): string {
  return JSON.stringify(value ?? []);
}
