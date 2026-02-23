// Supabase DB tools for MCP
// Uses service role key — bypasses RLS, so caller must pass a verified user_id.
// Auth note: the web app uses custom ORCID cookies (not Supabase JWT), so
// protected tools accept user_id (UUID from users table) as an explicit param.

import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key);
}

export type Comment = {
  id: string;
  paper_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  display_name?: string;
};

export type SavedPaper = {
  paper_id: string;
  saved_at: string;
};

// ── Public ────────────────────────────────────────────────────────────────────

export async function getComments(paper_id: string): Promise<Comment[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("comments")
    .select("id, paper_id, user_id, parent_id, content, created_at, users(display_name)")
    .eq("paper_id", paper_id)
    .is("annotation_id", null) // paper-level only
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    paper_id: row.paper_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    content: row.content,
    created_at: row.created_at,
    display_name: (row.users as unknown as { display_name: string } | null)?.display_name,
  }));
}

// ── Authenticated (caller must supply verified user_id) ───────────────────────

export async function postComment(
  paper_id: string,
  content: string,
  user_id: string,
  parent_id?: string
): Promise<Comment> {
  const sb = getClient();
  const { data, error } = await sb
    .from("comments")
    .insert({
      paper_id,
      content,
      user_id,
      parent_id: parent_id ?? null,
      annotation_id: null,
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as Comment;
}

export async function savePaper(paper_id: string, user_id: string): Promise<void> {
  const sb = getClient();
  const { error } = await sb
    .from("saved_papers")
    .upsert({ paper_id, user_id }, { onConflict: "user_id,paper_id" });

  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function unsavePaper(paper_id: string, user_id: string): Promise<void> {
  const sb = getClient();
  const { error } = await sb
    .from("saved_papers")
    .delete()
    .eq("user_id", user_id)
    .eq("paper_id", paper_id);

  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function listSavedPapers(user_id: string): Promise<SavedPaper[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("saved_papers")
    .select("paper_id, saved_at")
    .eq("user_id", user_id)
    .order("saved_at", { ascending: false });

  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []) as SavedPaper[];
}
