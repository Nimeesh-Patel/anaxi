# Activity Log

## Current State
PRD and plan written. No code yet. Starting implementation next session.

## Stack Decision
Next.js 15 (App Router) · TypeScript · Supabase (PostgreSQL + auth session) · ORCID OAuth (custom) · Tailwind · shadcn/ui · Vercel

## Key Design Decisions
- ORCID = identity/anti-bot layer only, not credential gate
- Paper render: arXiv HTML primary (`arxiv.org/html/{id}`), PDF.js fallback
- Annotation anchors: `{paper_id, version, text_hash, char_offset}` — orphaned on version update → archived not deleted
- Moderation: flag-based, Popperian tolerance (ban anti-rational behavior, not heterodox ideas)
- MVP: arXiv only, no Semantic Scholar / Gap Map

## Open Questions
- None blocking at this stage

## Failures / Dead Ends
- None yet
