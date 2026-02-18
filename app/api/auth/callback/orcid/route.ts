import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/orcid/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=orcid_denied", request.url));
  }

  try {
    const { orcid, access_token, name } = await exchangeCode(code);
    const supabase = createAdminClient();

    // Upsert user record
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
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
