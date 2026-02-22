import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

const VALID_REASONS = ["ad_hominem", "coercion", "intimidation", "other"] as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_id, target_type, reason } = await req.json();
  if (!target_id || !target_type || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid flag" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("flags").insert({
    user_id: session.id,
    target_id,
    target_type,
    reason,
  });

  if (error?.code === "23505") {
    // Unique constraint: already flagged
    return NextResponse.json({ error: "Already flagged" }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: true }, { status: 201 });
}
