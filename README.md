# Anaxi

Open science criticism platform. Discover arXiv papers, read them cleanly, annotate inline, and engage in serious rational debate — grounded in Popperian open society values.

## Project Structure
```
anaxi/
├── apps/
│   ├── web/                      # Next.js (Vercel)
│   │   ├── app/
│   │   │   ├── api/chat/route.ts # Sarvam orchestration loop (tool calling)
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── mcp.ts            # MCP REST client (web → MCP server)
│   │   │   ├── sarvam.ts         # Sarvam API wrapper
│   │   │   ├── orcid/
│   │   │   ├── supabase/
│   │   │   ├── session.ts
│   │   │   └── utils.ts
│   │   ├── supabase/schema.sql
│   │   ├── proxy.ts
│   │   └── types/
│   │
│   └── mcp/                       # HTTP MCP server (Railway)
│       ├── src/
│       │   ├── index.ts          # Express entry, /mcp endpoint
│       │   ├── router.ts         # Tool registration
│       │   ├── tools/
│       │   │   ├── search-arxiv.ts
│       │   │   ├── get-paper.ts
│       │   │   ├── semantic-scholar.ts
│       │   ├── services/
│       │   │   └── cache.ts
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── arxiv/                     # Pure arXiv client
│   │   └── src/index.ts
│   ├── semantic-scholar/
│   │   └── src/index.ts
│   └── database/
│       └── src/index.ts          # Supabase client + typed ops
│
├── package.json
├── turbo.json
├── prd.md
├── plan.md
└── activity.md
```

## Stack
Next.js 16 · TypeScript · PostgreSQL (Supabase) · Tailwind · shadcn/ui · MCP SDK

## Setup
```bash
npm install
npm run build:libs               # build shared packages first
npm run dev                      # web app on localhost:3000
npm run dev:mcp                  # MCP server on port 3001
```

## Env Vars

**Web** (`apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ORCID_CLIENT_ID=...
ORCID_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
MCP_URL=http://localhost:3001      # Railway URL in prod
MCP_SERVER_TOKEN=...               # optional shared secret for MCP REST endpoint
SARVAM_API_KEY=...                 # for /api/chat tool orchestration
SARVAM_MODEL=...                   # optional, defaults to sarvam-m
```

**MCP** (`apps/mcp/.env`):
```
PORT=3001
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
MCP_SERVER_TOKEN=...              # optional; if set, /tools/:name requires x-mcp-token
```

## MCP Server (Research Orchestration Layer)
- **MCP endpoint**: `POST /mcp` (Streamable HTTP — for Claude/AI clients)
- **REST endpoint**: `POST /tools/:name` (JSON)
- **Tool-call endpoint**: `POST /tool` with `{ name, arguments }` (OpenAI-style)
- **Health**: `GET /health`
- Centralizes deterministic tool execution and caching
- Deployable on Railway (set PORT, bind 0.0.0.0)

## MCP Tools
| Tool | Description |
|------|-------------|
| `search_papers` | Search arXiv |
| `get_paper` | Paper metadata by arXiv ID |
| `get_paper_text` | Full HTML text |
| `search_semantic_scholar` | Search with citations, TL;DR |
| `get_semantic_scholar_paper` | Detailed metadata |
| `get_paper_references` / `get_paper_citations` | Citation graph |
| `get_comments` / `post_comment` | Discussion |
| `save_paper` / `unsave_paper` / `list_saved_papers` | Reading list |

## Deployment
- **Web**: Vercel — Root Directory = `apps/web`
- **MCP**: Railway/Render/Fly — deploy from repo root so workspace packages are available.
  - Build command: `npm run build:mcp`
  - Start command: `npm run start --workspace=apps/mcp`
  - Required env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Optional env: `MCP_SERVER_TOKEN` to require `x-mcp-token` on `/tools/:name`

## DB Schema
Run `apps/web/supabase/schema.sql` against your Supabase project.
