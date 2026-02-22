import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const protectedPaths = ["/profile"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !request.cookies.get("anaxi_user_id")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
