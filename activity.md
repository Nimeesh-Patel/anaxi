# Activity Log

## Current State
MVP scaffold complete. Build passes. No Supabase instance connected yet — needs env vars.
PRD and plan updated with improved vision (2026-02-18).

## What's Built
- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- ORCID OAuth: `/login` → ORCID → `/auth/callback` → httpOnly cookie session (`anaxi_user_id`, `anaxi_orcid`)
- arXiv search + pagination (regex Atom XML parser, no external deps)
- Paper page: arXiv HTML proxied via `/api/paper/[id]/html` (same-origin iframe for text selection)
- Text selection → `postMessage` → `AnnotationPopover` → `POST /api/annotations`
- PDF.js fallback for papers without HTML version
- Paper-level discussion (threaded comments, reply, vote, flag)
- Profile page per ORCID iD
- Route protection via `proxy.ts`

## Key Design Decisions
- Annotation anchors: `{paper_id, version, text_hash, char_start, char_end}` — orphaned on version update → `is_archived=true`
- Moderation flag reasons: ad_hominem / coercion / intimidation / other
- arXiv HTML proxied server-side to avoid cross-origin DOM restrictions
- Session: custom cookies, not Supabase Auth

## To Do Next
- Show existing annotations as highlights in iframe (popover creates but no visual highlight yet)
- Kindle-style highlight count overlay on annotated spans
- Annotation sidebar (list all annotations on a paper) with upvoting + sort
- Wire up annotation archiving on paper version update
- Vote score display on comments
- Fix Supabase RLS: switch to service role key for server-side writes (current policies use auth.uid() which doesn't match custom cookie session)
- `.env.local` setup guide

## Known Issues
- Annotation highlights not shown in iframe (infrastructure exists, display missing)
- Supabase RLS policies incompatible with custom cookie session — use service role on server
