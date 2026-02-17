"use server";

import Link from "next/link";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await getSession();

  return (
    <nav className="border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Anaxi
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={`/profile/${session.orcid}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {session.orcid}
              </Link>
              <form action="/auth/logout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
