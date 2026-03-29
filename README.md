# 🎛️ Mission Control

**Real-time observability and control for your Claude agent network.**

A local-first Next.js dashboard with full Kanban task management, searchable long-term memory, calendar/scheduler, team visualization, an animated Digital Office, and a live ops panel.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment (optional — works offline without creds)
cp .env.local.example .env.local

# 3. Start development server
npm run dev

# Open → http://localhost:3000
```

The database (SQLite) is auto-created at `./mission-control.db` on first run with realistic seed data.

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Task Board** | `/dashboard/tasks` | Kanban with drag-and-drop, create/edit/delete tasks |
| **Memory** | `/dashboard/memory` | Searchable long-term memory documents |
| **Calendar** | `/dashboard/calendar` | Scheduled automations + Google Calendar events |
| **Team** | `/dashboard/team` | Agent cards with health, tokens, workload |
| **Digital Office** | `/dashboard/office` | Animated agent desks — click any agent to inspect |
| **Ops Panel** | `/dashboard/ops` | Service health, token charts, live log stream |

**Global Search**: `Cmd+K` (or `Ctrl+K`) — searches across tasks, memories, and agents.

---

## Real-time Updates

The dashboard uses **Server-Sent Events (SSE)** at `/api/stream`. Every API mutation broadcasts an event that automatically refreshes the relevant views — no page reload needed.

---

## Google Calendar / Gmail Integration

Set these in `.env.local`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
```

To get a refresh token:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Desktop app type)
3. Enable Calendar API + Gmail API
4. Use the OAuth Playground or a quick script to exchange for a refresh token

Then click **"Sync Google"** in the Calendar screen to pull your events.

---

## Architecture

```
mission-control/
├── app/
│   ├── api/                 # REST + SSE API routes
│   └── dashboard/           # 6 main screens
├── components/              # UI components per screen
├── hooks/                   # React Query data hooks
├── lib/
│   ├── db/                  # SQLite schema + helpers
│   ├── events.ts            # SSE event emitter
│   └── integrations/        # Google Calendar, Gmail, Claude tasks
└── types/                   # Shared TypeScript types
```

**Data layer**: SQLite via `better-sqlite3` (single file, WAL mode, zero config)
**State**: React Query + Zustand
**Real-time**: Server-Sent Events
**UI**: Tailwind CSS dark ops theme + JetBrains Mono

---

## Auto-logging Agent Actions

Use the integration helper from your agent code:

```typescript
import { logAgentAction, completeAgentTask } from '@/lib/integrations/claude-tasks';

// When an agent starts work:
const taskId = await logAgentAction({
  agentId: 'agent-atlas',
  title: 'Researching competitor X',
  priority: 'high',
  tags: ['research'],
  tokenCost: 1200,
});

// When done:
await completeAgentTask(taskId, 'agent-atlas', 800);
```

This creates a visible task card on the board and broadcasts the event in real-time.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Optional | OAuth refresh token for Calendar/Gmail |
| `ANTHROPIC_API_KEY` | Optional | For future agent integrations |
| `DB_PATH` | Optional | Custom SQLite path (default: `./mission-control.db`) |
| `NEXTAUTH_SECRET` | Optional | Required for auth (if you add it) |

---

## Development

```bash
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
```
