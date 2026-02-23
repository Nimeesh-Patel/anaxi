// Supabase client and typed operations — shared by web app and MCP
// Uses service role key for server-side; caller must pass verified user_id for protected ops.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

export function createSupabaseClient(
  url: string,
  serviceRoleKey: string
): SupabaseClient {
  return createClient(url, serviceRoleKey);
}

export async function getComments(
  client: SupabaseClient,
  paper_id: string
): Promise<Comment[]> {
  const { data, error } = await client
    .from("comments")
    .select("id, paper_id, user_id, parent_id, content, created_at, users(display_name)")
    .eq("paper_id", paper_id)
    .is("annotation_id", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    paper_id: row.paper_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    content: row.content,
    created_at: row.created_at,
    display_name: (row.users as unknown as { display_name: string } | null)
      ?.display_name,
  }));
}

export async function postComment(
  client: SupabaseClient,
  paper_id: string,
  content: string,
  user_id: string,
  parent_id?: string
): Promise<Comment> {
  const { data, error } = await client
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

export async function savePaper(
  client: SupabaseClient,
  paper_id: string,
  user_id: string
): Promise<void> {
  const { error } = await client
    .from("saved_papers")
    .upsert({ paper_id, user_id }, { onConflict: "user_id,paper_id" }); // unique(user_id, paper_id)
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function unsavePaper(
  client: SupabaseClient,
  paper_id: string,
  user_id: string
): Promise<void> {
  const { error } = await client
    .from("saved_papers")
    .delete()
    .eq("user_id", user_id)
    .eq("paper_id", paper_id);
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function listSavedPapers(
  client: SupabaseClient,
  user_id: string
): Promise<SavedPaper[]> {
  const { data, error } = await client
    .from("saved_papers")
    .select("paper_id, saved_at")
    .eq("user_id", user_id)
    .order("saved_at", { ascending: false });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []) as SavedPaper[];
}
