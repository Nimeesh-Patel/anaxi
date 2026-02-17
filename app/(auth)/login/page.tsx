import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizationUrl } from "@/lib/orcid/oauth";
import { Button } from "@/components/ui/button";
import crypto from "crypto";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

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
