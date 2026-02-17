# Activity Log

## Current State
MVP scaffold complete. Build passes. No Supabase instance connected yet — needs env vars.

## What's Built
- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- ORCID OAuth flow: `/login` → ORCID → `/auth/callback` → cookie session
- Custom session: `anaxi_user_id` + `anaxi_orcid` httpOnly cookies (not Supabase Auth)
- arXiv search + pagination (regex Atom XML parser, no external deps)
- Paper page: arXiv HTML proxied via `/api/paper/[id]/html` (same-origin iframe for text selection)
- Text selection → `postMessage` → `AnnotationPopover` → `POST /api/annotations`
- PDF.js fallback for papers without HTML version
- Paper-level discussion (threaded comments, reply, vote, flag)
- Profile page per ORCID iD
- Route protection via `proxy.ts`

## Stack Decision
Next.js 16 · TypeScript · Supabase (PostgreSQL) · ORCID OAuth (custom) · Tailwind · shadcn/ui

## Key Design Decisions
- Annotation anchors: `{paper_id, version, text_hash, char_start, char_end, anchor_id}` — orphaned on version update → `is_archived=true`
- Moderation: flag reasons are ad_hominem / coercion / intimidation / other
- arXiv HTML proxied server-side to avoid cross-origin DOM restrictions
- Session: custom cookies, not Supabase Auth (simpler with ORCID)

## To Do Next
- Wire up version-check annotation archiving (cron or on-load check)
- Show existing annotations as highlights inside the proxied iframe
- Annotation sidebar (list all annotations on a paper)
- Vote score display on comments
- `.env.local` setup guide for first run

## Known Issues / Limitations
- Annotation highlights not yet shown in iframe (popover creates them but no visual highlight)
- Supabase RLS policies reference `auth.uid()` but we're using custom cookies — needs fixing to use service role for writes or a different policy approach
