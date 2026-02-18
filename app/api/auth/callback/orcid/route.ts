import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/orcid/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

function errRedirect(request: NextRequest, code: string, detail: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", code);
  url.searchParams.set("detail", detail.slice(0, 200)); // cap length for URL safety
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return errRedirect(request, "orcid_denied", error ?? "no code");
  }

  // Phase 1: Exchange code with ORCID
  let orcid: string, access_token: string, name: string;
  try {
    ({ orcid, access_token, name } = await exchangeCode(code));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("ORCID token exchange failed:", msg);
    return errRedirect(request, "orcid_token", msg);
  }

  // Phase 2: Upsert user in DB
  try {
    const supabase = createAdminClient();
    const { data: user, error: dbError } = await supabase
      .from("users")
      .upsert(
        { orcid_id: orcid, display_name: name || orcid },
        { onConflict: "orcid_id", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (dbError) throw dbError;

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("anaxi_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set("anaxi_orcid", orcid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set("anaxi_orcid_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("DB upsert failed:", msg);
    return errRedirect(request, "db_write", msg);
  }
}
