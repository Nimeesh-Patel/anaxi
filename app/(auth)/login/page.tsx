import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAuthorizationUrl } from "@/lib/orcid/oauth";
import { Button } from "@/components/ui/button";
import crypto from "crypto";

const ERROR_LABELS: Record<string, string> = {
  orcid_denied: "ORCID sign-in was cancelled.",
  orcid_token: "ORCID token exchange failed.",
  db_write: "Could not save your profile to the database.",
  auth_failed: "Authentication failed.",
};

type Props = { searchParams: Promise<{ error?: string; detail?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  if (session) redirect("/");

  const { error, detail } = await searchParams;
  const state = crypto.randomBytes(16).toString("hex");
  const orcidUrl = getAuthorizationUrl(state);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-auto px-6 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Anaxi</h1>
          <p className="text-muted-foreground leading-relaxed">
            Papers, annotations, and serious debate — grounded in the idea that
            anyone can make a real contribution, and every argument stands or
            falls on its own merit.
          </p>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground border-l-2 border-primary/30 pl-4">
          <p>Flat hierarchies. No authority arguments.</p>
          <p>Everyone is fallible — including the greatest minds.</p>
          <p>The most trivial objection may be key to a great discovery.</p>
        </div>

        {error && (
          <div className="text-left bg-destructive/10 rounded px-3 py-2 space-y-1">
            <p className="text-sm text-destructive font-medium">
              {ERROR_LABELS[error] ?? `Error: ${error}`}
            </p>
            {detail && (
              <p className="text-xs text-destructive/80 font-mono break-all">{detail}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <a href={orcidUrl}>
            <Button className="w-full" size="lg">
              Sign in with ORCID
            </Button>
          </a>
          <p className="text-xs text-muted-foreground text-center">
            ORCID is free, open, and takes 2–3 minutes to create. No
            institutional affiliation needed.
          </p>
        </div>
      </div>
    </main>
  );
}
