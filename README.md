# Anaxi

Open science criticism platform. Discover arXiv papers, read them cleanly, annotate inline, and engage in serious rational debate — grounded in Popperian open society values.

## Stack
Next.js 15 · TypeScript · PostgreSQL (Supabase) · Tailwind · shadcn/ui

## Setup
```bash
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, ORCID_CLIENT_ID, ORCID_CLIENT_SECRET
npm install
npm run dev
```

## DB Schema
Run `supabase/schema.sql` against your Supabase project.

## Workflow Files
- `prd.md` — product requirements
- `plan.md` — feature list with test steps
- `activity.md` — session memory and progress log
