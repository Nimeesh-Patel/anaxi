# Activity Log

## Current State
Monorepo restructure complete (2026-02-23). Both packages build. No Supabase instance connected yet.

## What's Built
- **npm workspaces monorepo**: `apps/web` (Next.js), `services/mcp` (MCP server)
- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- ORCID OAuth: `/login` → ORCID → `/auth/callback` → httpOnly cookie session (`anaxi_user_id`, `anaxi_orcid`)
- arXiv search + pagination (regex Atom XML parser, no external deps)
- Paper page: arXiv HTML proxied via `/api/paper/[id]/html` (same-origin iframe for text selection)
- Text selection → `postMessage` → `AnnotationPopover` → `POST /api/annotations`
- PDF.js fallback for papers without HTML version
- Paper-level discussion (threaded comments, reply, vote, flag)
- Profile page per ORCID iD
- Route protection via `proxy.ts`
- **MCP server** (`services/mcp`): 7 tools — `search_arxiv`, `get_arxiv_paper`, `get_arxiv_paper_text`, `search_semantic_scholar`, `get_semantic_scholar_paper`, `get_paper_references`, `get_paper_citations`

## Key Design Decisions
- Annotation anchors: `{paper_id, version, text_hash, char_start, char_end}` — orphaned on version update → `is_archived=true`
- Moderation flag reasons: ad_hominem / coercion / intimidation / other
- arXiv HTML proxied server-side to avoid cross-origin DOM restrictions
- Session: custom cookies, not Supabase Auth
- MCP tool registration: wrapped in a helper to avoid TS2589 (TypeScript 5.9 + Zod 4 deep type instantiation with MCP SDK's overloaded generics)
- **Vercel**: update root directory setting to `apps/web` after next deploy

## To Do Next
- Show existing annotations as highlights in iframe (popover creates but no visual highlight yet)
- Kindle-style highlight count overlay on annotated spans
- Annotation sidebar (list all annotations on a paper) with upvoting + sort
- Wire up annotation archiving on paper version update
- Vote score display on comments
- `.env.local` setup guide

## Known Issues
- Annotation highlights not shown in iframe (infrastructure exists, display missing)
