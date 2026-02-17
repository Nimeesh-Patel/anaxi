import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paper_id");
  if (!paperId) return NextResponse.json([], { status: 200 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("annotations")
    .select("*, user:users(display_name, orcid_id)")
    .eq("paper_id", paperId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { paper_id, paper_version, selected_text, char_start, char_end, anchor_id, content } = body;

  if (!paper_id || !selected_text || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const text_hash = crypto.createHash("sha256").update(selected_text).digest("hex");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("annotations")
    .insert({
      paper_id,
      paper_version: paper_version ?? 1,
      user_id: session.id,
      selected_text,
      text_hash,
      char_start: char_start ?? 0,
      char_end: char_end ?? 0,
      anchor_id: anchor_id ?? null,
      content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
