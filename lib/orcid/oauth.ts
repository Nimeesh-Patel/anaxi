// ORCID OAuth 2.0 helpers
// Docs: https://info.orcid.org/documentation/integration-guide/

const ORCID_BASE = "https://orcid.org";
const ORCID_API = "https://pub.orcid.org/v3.0";

// NEXT_PUBLIC_APP_URL must be set in Vercel env vars to https://anaxi.vercel.app
// Falls back to VERCEL_URL (auto-set by Vercel) for preview deployments
function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.ORCID_CLIENT_ID!,
    response_type: "code",
    scope: "/authenticate",
    redirect_uri: `${getAppUrl()}/api/auth/callback/orcid`,
    state,
  });
  return `${ORCID_BASE}/oauth/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  orcid: string;
  access_token: string;
  name: string;
}> {
  const res = await fetch(`${ORCID_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.ORCID_CLIENT_ID!,
      client_secret: process.env.ORCID_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${getAppUrl()}/api/auth/callback/orcid`,
    }),
  });

  if (!res.ok) throw new Error("ORCID token exchange failed");
  const data = await res.json();
  return {
    orcid: data.orcid,
    access_token: data.access_token,
    name: data.name ?? "",
  };
}

export async function getOrcidRecord(orcid: string, accessToken: string) {
  const res = await fetch(`${ORCID_API}/${orcid}/record`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  return res.json();
}
