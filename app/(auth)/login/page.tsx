import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAuthorizationUrl } from "@/lib/orcid/oauth";
import { Button } from "@/components/ui/button";
import crypto from "crypto";

const ERROR_MESSAGES: Record<string, string> = {
  orcid_denied: "You cancelled the ORCID sign-in.",
  orcid_token: "ORCID token exchange failed — check that ORCID_CLIENT_SECRET is set in Vercel env vars.",
  db_write: "Could not save your profile — check SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in Vercel env vars.",
  auth_failed: "Authentication failed.",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  if (session) redirect("/");

  const { error } = await searchParams;
  const state = crypto.randomBytes(16).toString("hex");
  const orcidUrl = getAuthorizationUrl(state);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Anaxi</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Open science criticism — papers, annotations, debate.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
            {ERROR_MESSAGES[error] ?? `Error: ${error}`}
          </p>
        )}

        <a href={orcidUrl}>
          <Button className="w-full gap-2">
            Sign in with ORCID
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">
          ORCID is free to create and open to anyone. No institutional
          affiliation required.
        </p>
      </div>
    </main>
  );
}
