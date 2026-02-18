# PRD: Anaxi — Open Science Criticism Platform

## Problem
Most research institutions are broken:
- Bureaucracy and coercive policies stagnate knowledge creation
- Structured to prevent progress in fundamental theories or creation of new ones
- Research is gatekept — the assumption is that ordinary people cannot make real contributions

People don't know where to access the best research culture and tradition of criticism.

Reference good model: [Conjecture Institute](https://www.conjectureinstitute.org/)

## Vision
Digitize the best research culture so anyone can participate. Not just "a" culture — the *best* culture: Popperian open society values, flat hierarchies, fallibilism, ideas judged on content not authority.

People are unfathomably different from each other — this platform is designed to harness that.

A public website that makes arXiv papers easy to discover, understand, debate, and criticise. Online reach that no physical institution can match.

---

## Users
Anyone with an ORCID account (free, open, 2-3 min, no institutional affiliation). ORCID prevents bots/sockpuppets without gatekeeping genuinely interested people.

---

## Core Features (MVP)

### 1. Paper Discovery & Display
- Search and browse arXiv papers via arXiv API
- Primary render: arXiv HTML version (`arxiv.org/html/{id}`) — annotation-friendly, readable
- Fallback: PDF.js viewer for papers without HTML versions
- Show: title, authors, abstract, categories, date, version

### 2. In-Paper Annotation
- Highlight text spans and attach comments (like Google Docs inline comments)
- Kindle-style: show highlight count on frequently annotated passages
- Anchors: `{paper_id, version, text_hash, char_offset_start, char_offset_end}`
- Version updates: unchanged anchors persist; orphaned anchors archived (not deleted), labeled "from earlier version"
- Threaded replies on any annotation
- Annotations rankable by community — surfaces best explanations and criticisms

### 3. Paper-Level Discussion
- Separate discussion section per paper (broad critiques, summaries, questions)
- Threaded comments, no character limit

### 4. Comment Quality & Ranking
- Upvotes/downvotes shown as **signal**, not used for default sort
- Default: chronological. Optional: by rating
- Low-voted comments stay visible — avoids "popular = correct" trap

### 5. Moderation — Popperian Tolerance
- **Banned**: ad hominem, authority-as-argument, coercion, intimidation, anything that chills others' free speech
- **Not banned**: unpopular ideas, heterodox views, sharp disagreement, criticism of consensus
- Flag-based: community flags → human review; bans are public with stated reason

### 6. Authentication
- ORCID OAuth only; on first login choose display name
- Sessions via httpOnly cookies

---

## Phase 2 Integrations
- [Gap Map](https://www.gap-map.org) — surface under-explored research areas alongside papers
- [Semantic Scholar](https://www.semanticscholar.org) — citations, related papers, cross-references
- [Convergent Research](https://www.convergentresearch.org) — link papers to focused research projects

---

## Technical Stack
- Next.js 15 (App Router, TypeScript) · Supabase (PostgreSQL) · Tailwind + shadcn/ui
- Auth: ORCID OAuth (custom flow) + httpOnly cookie session
- Paper rendering: arXiv HTML proxied server-side + PDF.js fallback
- Deployment: Vercel

---

## Key Technical Risks

| Risk | Mitigation |
|------|-----------|
| arXiv HTML unavailable for some papers | PDF.js fallback |
| Text anchors break on version update | Hash-based matching; archive orphans |
| Supabase RLS uses auth.uid() but we use custom cookies | Use service role key for server-side writes |
| Cold start / empty platform | Seed landmark papers with pre-written annotations |

---

## Non-Goals (MVP)
- No peer review recreation
- No user prestige ranking
- No feed algorithm
- No Gap Map / Semantic Scholar integration (Phase 2)
- No mobile app
