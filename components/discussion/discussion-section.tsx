"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CommentItem } from "./comment-item";
import type { Comment } from "@/types";

type Props = { paperId: string };

export function DiscussionSection({ paperId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/comments?paper_id=${encodeURIComponent(paperId)}`);
    if (res.ok) setComments(await res.json());
  }

  useEffect(() => { load(); }, [paperId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paperId, content }),
    });
    if (res.status === 401) setError("Sign in to comment.");
    else if (!res.ok) setError("Failed to post.");
    else { setContent(""); load(); }
    setPosting(false);
  }

  return (
    <div className="space-y-6 pt-8">
      <Separator />
      <h2 className="font-semibold">Discussion</h2>

      <form onSubmit={handlePost} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add to the discussion..."
          rows={4}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={posting || !content.trim()}>
            {posting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No discussion yet. Start one.</p>
      )}

      <div className="space-y-4">
        {comments
          .filter((c) => !c.parent_id)
          .map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comments.filter((c) => c.parent_id === comment.id)}
              paperId={paperId}
              onReply={load}
            />
          ))}
      </div>
    </div>
  );
}
