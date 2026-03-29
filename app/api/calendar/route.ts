import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbGet, dbRun } from '@/lib/db';
import { fetchGoogleCalendarEvents } from '@/lib/integrations/google-calendar';
import { v4 as uuidv4 } from 'uuid';
import type { CalendarEvent } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const syncGoogle = searchParams.get('sync') === 'true';

  if (syncGoogle) {
    const googleEvents = await fetchGoogleCalendarEvents();
    for (const event of googleEvents) {
      const existing = await dbGet('SELECT id FROM calendar_events WHERE id = ?', [event.id]);
      if (!existing) {
        await dbRun(
          `INSERT INTO calendar_events (id, title, description, start, end, recurrence, source, agent_id, task_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [event.id, event.title, event.description ?? null, event.start, event.end,
           event.recurrence ?? null, 'google', null, null, event.status ?? 'confirmed']
        );
      }
    }
  }

  const rows = await dbQuery<CalendarEvent>('SELECT * FROM calendar_events ORDER BY start ASC');
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `evt-${uuidv4().split('-')[0]}`;

  await dbRun(
    `INSERT INTO calendar_events (id, title, description, start, end, recurrence, source, agent_id, task_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.title, body.description ?? null, body.start, body.end,
     body.recurrence ?? null, 'local', body.agent_id ?? null, body.task_id ?? null, 'confirmed']
  );

  const event = await dbGet<CalendarEvent>('SELECT * FROM calendar_events WHERE id = ?', [id]);
  return NextResponse.json({ data: event }, { status: 201 });
}
