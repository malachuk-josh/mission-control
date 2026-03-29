/**
 * Google Calendar integration
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 * Setup: See .env.local.example for instructions
 */

import type { CalendarEvent } from '@/types';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  recurrence?: string[];
  status?: string;
}

function getAuthClient() {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    return null;
  }

  // Dynamic import to avoid issues when creds aren't set
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { google } = require('googleapis');
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return { auth, google };
}

export async function fetchGoogleCalendarEvents(
  maxResults = 50,
  timeMin?: string
): Promise<CalendarEvent[]> {
  const client = getAuthClient();
  if (!client) {
    console.warn('[GCal] No credentials configured — skipping Google Calendar sync');
    return [];
  }

  try {
    const calendar = client.google.calendar({ version: 'v3', auth: client.auth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin ?? new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items: GoogleEvent[] = response.data.items ?? [];

    return items.map((item) => ({
      id: `gcal-${item.id}`,
      title: item.summary ?? '(No title)',
      description: item.description,
      start: item.start.dateTime ?? item.start.date ?? '',
      end: item.end.dateTime ?? item.end.date ?? '',
      recurrence: item.recurrence?.[0],
      source: 'google' as const,
      status: (item.status as CalendarEvent['status']) ?? 'confirmed',
    }));
  } catch (err) {
    console.error('[GCal] Failed to fetch events:', err);
    return [];
  }
}
