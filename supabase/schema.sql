-- Run this against your Supabase project

create table users (
  id uuid primary key default gen_random_uuid(),
  orcid_id text unique not null,
  display_name text not null,
  created_at timestamptz default now()
);

-- Inline annotations on paper text
create table annotations (
  id uuid primary key default gen_random_uuid(),
  paper_id text not null,          -- arXiv ID e.g. "2307.09288"
  paper_version int not null,
  user_id uuid references users(id) on delete cascade,
  selected_text text not null,     -- actual highlighted text
  text_hash text not null,         -- sha256 of selected_text for version matching
  char_start int not null,
  char_end int not null,
  anchor_id text,                  -- nearest parent element id for re-anchoring
  content text not null,           -- the annotation body
  is_archived boolean default false, -- true when text no longer found in newer version
  created_at timestamptz default now()
);

-- Paper-level discussion + annotation reply threads (unified)
-- annotation_id null = paper-level comment
-- parent_id null = top-level thread
create table comments (
  id uuid primary key default gen_random_uuid(),
  paper_id text not null,
  annotation_id uuid references annotations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  target_id uuid not null,
  target_type text not null check (target_type in ('comment', 'annotation')),
  value int not null check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(user_id, target_id)
);

create table flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  target_id uuid not null,
  target_type text not null check (target_type in ('comment', 'annotation')),
  reason text not null check (reason in ('ad_hominem', 'coercion', 'intimidation', 'other')),
  created_at timestamptz default now(),
  unique(user_id, target_id)
);

-- Indexes
create index on annotations(paper_id);
create index on annotations(text_hash);
create index on comments(paper_id);
create index on comments(annotation_id);
create index on comments(parent_id);
create index on votes(target_id);
create index on flags(target_id);

-- Enable RLS
alter table users enable row level security;
alter table annotations enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table flags enable row level security;

-- RLS policies: read-public, write-own
create policy "Public read users" on users for select using (true);
create policy "Insert own user" on users for insert with check (true);

create policy "Public read annotations" on annotations for select using (true);
create policy "Insert own annotation" on annotations for insert with check (auth.uid()::text = user_id::text);
create policy "Delete own annotation" on annotations for delete using (auth.uid()::text = user_id::text);

create policy "Public read comments" on comments for select using (true);
create policy "Insert own comment" on comments for insert with check (auth.uid()::text = user_id::text);
create policy "Delete own comment" on comments for delete using (auth.uid()::text = user_id::text);

create policy "Public read votes" on votes for select using (true);
create policy "Manage own votes" on votes for all using (auth.uid()::text = user_id::text);

create policy "Insert own flag" on flags for insert with check (auth.uid()::text = user_id::text);
