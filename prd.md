# PRD: Anaxi — Open Science Criticism Platform

## Problem
Research and scientific culture is inaccessible. There's no public space that embodies the best traditions of rational criticism: flat hierarchies, fallibilism, ideas judged on content not authority. Existing platforms (ResearchGate, Academia.edu, Twitter) either recreate academic gatekeeping or collapse into noise.

## Vision
A web platform where anyone can discover arXiv papers, read them cleanly, and engage in serious criticism — building a culture rooted in Popperian open society values: anti-authoritarianism, fallibilism, tolerance of everything except anti-rational behavior.

---

## Users
Anyone who creates an ORCID account (free, open, no institutional affiliation required). ORCID is the identity layer — it prevents bots and sockpuppets, not laypeople.

---

## Core Features (MVP)

### 1. Paper Discovery & Display
- Search and browse arXiv papers via arXiv API
- Primary render: arXiv HTML version (`arxiv.org/html/{id}`) — annotation-friendly, readable
- Fallback: PDF.js viewer for papers without HTML versions
- Show paper metadata: title, authors, abstract, categories, date, version

### 2. In-Paper Annotation
- Users highlight text spans within the HTML-rendered paper and attach comments
- Anchors stored as: `{paper_id, version, text_hash, char_offset_start, char_offset_end}`
- On new paper version: anchors whose text is unchanged persist; orphaned anchors are archived (not deleted), shown as "from earlier version"
- Annotation threads are nested: reply to any annotation

### 3. Paper-Level Discussion
- Separate discussion section below each paper (for broad critiques, summaries, questions)
- Threaded comments, no character limit

### 4. Comment Quality & Ranking
- Community upvotes/downvotes on comments — but shown as **signal**, not sorted by default
- Default sort: chronological. Optional: sort by rating.
- Avoids the "popular = correct" trap by not hiding low-voted comments

### 5. Moderation — Popperian Tolerance
- **Banned**: ad hominem, appeals to authority as argument-substitutes, coercion, intimidation, and any behavior that suppresses others' ability to speak freely
- **Not banned**: unpopular ideas, heterodox views, criticism of consensus, sharp disagreement
- Moderation is flag-based: community flags → human review (founding team initially)
- Bans are public with stated reason (transparency over secrecy)

### 6. Authentication
- ORCID OAuth only
- On first login: link ORCID profile, choose display name
- Sessions via standard JWT/cookie

---

## Out of Scope (MVP)
- Semantic Scholar / Gap Map integration
- Paper recommendation engine
- Private groups or DMs
- Mobile app

---

## Technical Stack
- **Frontend/Backend**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL via Supabase
- **Auth**: ORCID OAuth (custom OAuth flow) + Supabase session management
- **Styling**: Tailwind CSS + shadcn/ui
- **Paper rendering**: arXiv HTML (`arxiv.org/html/{id}`) with PDF.js fallback
- **Deployment**: Vercel

---

## Key Technical Risks

| Risk | Mitigation |
|------|-----------|
| arXiv HTML not available for all papers | PDF.js fallback; degrade gracefully |
| Text anchors break on version update | Hash-based matching; archive orphans, don't delete |
| ORCID OAuth complexity | Use ORCID's standard OAuth 2.0 flow; test thoroughly |
| Cold start / empty platform feel | Seed with pre-written annotations on landmark papers before public launch |

---

## Non-Goals
- Do not recreate peer review (we're building criticism culture, not publishing)
- Do not rank users by prestige or credentials
- Do not algorithmically amplify content (no feed algorithm)
