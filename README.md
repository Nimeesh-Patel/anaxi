# Anaxi

Open science criticism platform. Discover arXiv papers, read them cleanly, annotate inline, and engage in serious rational debate — grounded in Popperian open society values.

## Structure
```
anaxi/
  apps/
    web/        ← Next.js 15 app (deployed to Vercel)
  services/
    mcp/        ← MCP server (arXiv + Semantic Scholar tools)
```

## Stack
Next.js 15 · TypeScript · PostgreSQL (Supabase) · Tailwind · shadcn/ui · MCP SDK

## Setup
```bash
npm install                    # installs all workspaces
npm run dev                    # web app on localhost:3000
npm run dev:mcp                # MCP server on stdio
```

Web app env vars (in `apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ORCID_CLIENT_ID=...
ORCID_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## DB Schema
Run `apps/web/supabase/schema.sql` against your Supabase project.

## MCP Tools
| Tool | Description |
|------|-------------|
| `search_arxiv` | Search arXiv by keyword/author |
| `get_arxiv_paper` | Fetch paper metadata by ID |
| `get_arxiv_paper_text` | Fetch full HTML text of a paper |
| `search_semantic_scholar` | Search with citation counts + TL;DR |
| `get_semantic_scholar_paper` | Detailed metadata via Semantic Scholar |
| `get_paper_references` | Papers cited by a given paper |
| `get_paper_citations` | Papers that cite a given paper |

## Vercel Deployment
Set **Root Directory** to `apps/web` in Vercel project settings.

## Workflow Files
- `prd.md` — product requirements
- `plan.md` — feature list with test steps
- `activity.md` — session memory and progress log
