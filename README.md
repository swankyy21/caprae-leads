# Caprae Lead Intelligence

> AI-powered lead scoring and prioritization for ETA / search-fund acquisition sourcing.

Upload a CSV of prospective companies, and the tool scores every row with Claude across five M&A-specific dimensions, ranks them, and surfaces an acquisition thesis, key risks, and opportunities — all in seconds.

---

## Features

| Feature | Detail |
|---|---|
| **AI scoring** | Claude scores each lead across Revenue Fit, Industry Fit, Size Fit, Owner Reachability, and Growth Signals |
| **Acquisition thesis** | Claude writes a plain-English rationale, key risks, and opportunities per lead |
| **Tier filter** | One-click filter for Hot (80+), Warm (55+), and Nurture leads |
| **Redis caching** | Upstash REST cache avoids duplicate Claude calls for the same company / domain |
| **Supabase persistence** | All leads and score history saved to Postgres — cache-hit vs. fresh score tracked |
| **CSV export** | Export any filtered view to CSV for CRM import |
| **Outreach brief copy** | One-click copies a formatted brief for the selected lead to clipboard |
| **Deduplication** | Frontend deduplicates uploaded rows by website domain before sending to API |

---

## Architecture

```
┌────────────────────┐          POST
│   React (Vercel)   │ ─────────────────────────────► ┌──────────────────────┐
│                    │                                 │  FastAPI (Render)    │
│  CSV Upload        │                                 │                      │
│  Score Dashboard   │ ◄─────────────────────────────  │  ┌────────────────┐  │
│  Lead Detail       │       ScoredLead[]              │  │  Claude API    │  │
│  Tier Filter       │                                 │  └────────────────┘  │
│  CSV Export        │                                 │  ┌────────────────┐  │
└────────────────────┘                                 │  │ Upstash Redis  │  │
                                                       │  └────────────────┘  │
                                                       │  ┌────────────────┐  │
                                                       │  │  Supabase PG   │  │
                                                       │  └────────────────┘  │
                                                       └──────────────────────┘
```

**Stack:**

- **Frontend**: React 19, Recharts, Lucide icons, DM Sans / Syne / DM Mono (Google Fonts)
- **Backend**: FastAPI, Anthropic Python SDK, httpx (Upstash Redis), supabase-py
- **Database**: Supabase Postgres (leads + lead_scores tables)
- **Cache**: Upstash Redis REST API (30-day TTL per lead)
- **Hosting**: Vercel (frontend) + Render (backend)

---

## Repository Structure

```
caprae-leads/
├── frontend/              React dashboard
│   └── src/
│       ├── components/    Dashboard, Header, LeadDetail, LeadTable, UploadView
│       └── utils/         scoring.js (API client, CSV export, deduplication)
├── backend/
│   ├── app/
│   │   ├── main.py        FastAPI routes
│   │   ├── scoring.py     Claude prompting + fallback scorer
│   │   ├── database.py    Supabase persistence
│   │   ├── cache.py       Upstash Redis caching
│   │   ├── schemas.py     Pydantic models
│   │   └── config.py      Environment settings
│   ├── sql/
│   │   ├── schema.sql             Initial Supabase schema
│   │   └── 001_add_cache_columns.sql  Migration for existing tables
│   └── requirements.txt
├── data/
│   └── sample_leads.csv   Fabricated demo dataset (safe to commit)
├── render.yaml            Render backend deployment blueprint
└── vercel.json            Vercel frontend deployment config
```

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- [Anthropic API key](https://console.anthropic.com/)
- [Supabase project](https://supabase.com/)
- [Upstash Redis database](https://upstash.com/)

---

## Supabase Setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `backend/sql/schema.sql`.
3. If you already have the older tables, run `backend/sql/001_add_cache_columns.sql` instead.
4. Copy your **Project URL** and **service role key** (Settings → API).

> The service role key is backend-only. Never expose it in the frontend.

---

## Upstash Setup

1. Create an Upstash Redis database (free tier is fine).
2. Copy the **REST URL** and **REST Token** from the database console.

---

## Local Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ALLOW_FALLBACK_SCORING=false
FRONTEND_ORIGIN=http://localhost:3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Confirm all services are live:

```bash
curl http://localhost:8000/api/system/status
# {"status":"ok","claude_configured":true,"supabase_configured":true,"redis_configured":true}
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # REACT_APP_API_URL=http://localhost:8000
npm start
```

Open `http://localhost:3000` and upload `data/sample_leads.csv` to test the full flow.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/system/status` | Service configuration flags |
| `GET` | `/api/leads?limit=100` | Fetch persisted leads from Supabase |
| `POST` | `/api/leads/score` | Score a batch of leads with Claude |
| `POST` | `/api/export/csv` | Stream scored leads as a CSV file |
| `POST` | `/api/export/json` | Return scored leads as JSON |

---

## Scoring Dimensions

| Dimension | What it measures | Ideal signal |
|---|---|---|
| **Revenue Fit** | Annual revenue alignment | $1M – $20M ARR |
| **Industry Fit** | Sector stability and ETA match | B2B SaaS, services, logistics, healthcare |
| **Size Fit** | Team size alignment | 5 – 150 employees |
| **Owner Reachability** | Direct contact availability | Founder email + phone present |
| **Growth Signals** | Expansion, hiring, automation mentions | Job posts, new locations, AI adoption |

---

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. Import in [Vercel](https://vercel.com/new).
3. Framework: **Other** (or leave auto-detect).
4. Vercel will use `vercel.json` automatically — no extra config needed.
5. Add environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com`

### Backend → Render

1. Go to [Render](https://render.com) → **New → Blueprint**.
2. Connect your GitHub repo — Render reads `render.yaml` automatically.
3. Add the secret environment variables (those marked `sync: false` in `render.yaml`):
   - `ANTHROPIC_API_KEY`
   - `FRONTEND_ORIGIN` (your Vercel URL, e.g. `https://caprae-leads.vercel.app`)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy.

> **Note:** Free-tier Render services spin down after inactivity. The first request after a cold start may take ~30s.

---

## Dataset

`data/sample_leads.csv` is fabricated demo data and is safe to commit. Replace it with real scraped data only if you have permission to store and redistribute that dataset.

---

## Development Fallback Mode

Set `ALLOW_FALLBACK_SCORING=true` in `backend/.env` to use the local rule-based scorer instead of Claude. This lets you validate the full frontend → backend → Supabase → Redis flow without consuming API credits.
