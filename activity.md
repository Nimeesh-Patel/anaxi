# Activity Log

## Current State
Architecture wired: web → MCP REST → external APIs (2026-02-23).

## What's Built
- **apps/web**: Next.js 16, calls MCP server via `lib/mcp.ts` (no direct arXiv dep)
- **apps/mcp**: HTTP MCP server with two endpoints:
  - `POST /mcp` — MCP Streamable HTTP (for Claude/AI)
  - `POST /tools/:name` — REST JSON (for web app)
- **packages/**: arxiv, semantic-scholar, database — used by MCP only
- Sarvam AI wrapper for summarize/rank (SARVAM_API_KEY required)

## Key Decisions
- web → MCP via REST `/tools/:name`; MCP → arXiv/SS/Supabase
- Rate limiting, caching, AI calls all centralized in MCP
- Stateless MCP for Railway horizontal scaling

## To Do
- Wire annotation highlights in iframe
- Kindle-style highlight count
- Annotation sidebar with upvoting
