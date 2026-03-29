# Deploy Mission Control to Vercel

Get a permanent URL like `https://mission-control-jack.vercel.app` in about 5 minutes.

---

## Step 1 — Create a free Turso database

Turso is a hosted SQLite-compatible database. Free tier: unlimited reads, 500 databases.

1. Go to **[turso.tech](https://turso.tech)** → Sign up (GitHub login works)
2. Click **"Create database"** → name it `mission-control` → choose the closest region
3. Once created, click **"Generate token"** → copy the token
4. Copy your database URL — it looks like `libsql://mission-control-yourname.turso.io`

Keep these two values handy for Step 3.

---

## Step 2 — Push the project to GitHub

```bash
cd mission-control
git init
git add .
git commit -m "Initial Mission Control dashboard"

# Create a repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/mission-control.git
git push -u origin main
```

---

## Step 3 — Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign up / Log in (GitHub login works)
2. Click **"Add New Project"** → Import your `mission-control` GitHub repo
3. Vercel auto-detects Next.js — no build settings needed
4. Before clicking Deploy, click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `TURSO_DATABASE_URL` | `libsql://mission-control-yourname.turso.io` |
| `TURSO_AUTH_TOKEN` | `your-token-from-step-1` |

5. Click **"Deploy"** — done in ~90 seconds

Your dashboard will be live at `https://mission-control-yourname.vercel.app` ✓

The database auto-seeds with agents, tasks, and memories on first visit.

---

## Optional: Custom domain

In Vercel → Project → Settings → Domains → Add `dashboard.yourdomain.com`.

---

## Optional: Google Calendar / Gmail

Add these to your Vercel environment variables too:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token |

See `.env.local.example` for setup instructions.

---

## Local development (no Turso needed)

```bash
npm install
npm run dev   # Uses local ./mission-control.db automatically
```

Open http://localhost:3000
