import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_id, target_type, value } = await req.json();
  if (!target_id || !target_type || ![1, -1].includes(value)) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const supabase = await createClient();

  // Toggle: if same vote exists, delete it
  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", session.id)
    .eq("target_id", target_id)
    .maybeSingle();

  if (existing) {
    if (existing.value === value) {
      // Un-vote
      await supabase.from("votes").delete().eq("id", existing.id);
      return NextResponse.json({ removed: true });
    }
    // Change vote
    await supabase.from("votes").update({ value }).eq("id", existing.id);
    return NextResponse.json({ updated: true });
  }

  const { error } = await supabase.from("votes").insert({
    user_id: session.id,
    target_id,
    target_type,
    value,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: true }, { status: 201 });
}
