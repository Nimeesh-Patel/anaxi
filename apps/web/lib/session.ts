// Read session from cookies (server-side)
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  orcid: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("anaxi_user_id")?.value;
  const orcid = cookieStore.get("anaxi_orcid")?.value;
  if (!userId || !orcid) return null;
  return { id: userId, orcid };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}
