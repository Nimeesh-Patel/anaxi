import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: Promise<{ orcid: string }> };

export default async function ProfilePage({ params }: Props) {
  const { orcid } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("orcid_id", orcid)
    .single();

  if (!user) notFound();

  const [{ data: annotations }, { data: comments }] = await Promise.all([
    supabase
      .from("annotations")
      .select("id, paper_id, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("comments")
      .select("id, paper_id, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{user.display_name}</h1>
        <a
          href={`https://orcid.org/${user.orcid_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline"
        >
          orcid.org/{user.orcid_id}
        </a>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-sm">Annotations ({annotations?.length ?? 0})</h2>
        {annotations?.map((a) => (
          <div key={a.id} className="text-sm border-l-2 pl-3 space-y-0.5">
            <Link href={`/paper/${a.paper_id}`} className="text-xs text-muted-foreground underline">
              {a.paper_id}
            </Link>
            <p className="line-clamp-2">{a.content}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-sm">Comments ({comments?.length ?? 0})</h2>
        {comments?.map((c) => (
          <div key={c.id} className="text-sm border-l-2 pl-3 space-y-0.5">
            <Link href={`/paper/${c.paper_id}`} className="text-xs text-muted-foreground underline">
              {c.paper_id}
            </Link>
            <p className="line-clamp-2">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
