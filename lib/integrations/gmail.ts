/**
 * Gmail integration — read recent messages, create task drafts
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 */

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ mimeType: string; body?: { data?: string } }>;
  };
  internalDate?: string;
}

function getAuthClient() {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { google } = require('googleapis');
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return { auth, google };
}

export interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

export async function fetchRecentEmails(maxResults = 20): Promise<EmailSummary[]> {
  const client = getAuthClient();
  if (!client) {
    console.warn('[Gmail] No credentials configured — skipping Gmail integration');
    return [];
  }

  try {
    const gmail = client.google.gmail({ version: 'v1', auth: client.auth });
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });

    const messages: GmailMessage[] = await Promise.all(
      (listRes.data.messages ?? []).map(async (m: { id: string }) => {
        const res = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        });
        return res.data;
      })
    );

    return messages.map((msg) => {
      const headers = msg.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? '';
      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: get('Subject') || '(no subject)',
        from: get('From'),
        snippet: msg.snippet ?? '',
        date: get('Date'),
      };
    });
  } catch (err) {
    console.error('[Gmail] Failed to fetch emails:', err);
    return [];
  }
}
