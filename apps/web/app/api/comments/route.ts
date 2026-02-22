import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paper_id");
  if (!paperId) return NextResponse.json([], { status: 200 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, user:users(display_name, orcid_id)")
    .eq("paper_id", paperId)
    .is("annotation_id", null) // paper-level only
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { paper_id, content, parent_id, annotation_id } = body;

  if (!paper_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      paper_id,
      user_id: session.id,
      content: content.trim(),
      parent_id: parent_id ?? null,
      annotation_id: annotation_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
