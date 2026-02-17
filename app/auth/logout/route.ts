import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL!)
  );
  response.cookies.delete("anaxi_user_id");
  response.cookies.delete("anaxi_orcid");
  response.cookies.delete("anaxi_orcid_token");
  return response;
}
