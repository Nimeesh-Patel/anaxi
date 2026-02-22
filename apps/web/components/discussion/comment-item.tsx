"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/types";

type Props = {
  comment: Comment;
  replies: Comment[];
  paperId: string;
  onReply: () => void;
  depth?: number;
};

export function CommentItem({ comment, replies, paperId, onReply, depth = 0 }: Props) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [vote, setVote] = useState<number | null>(null);

  const author = comment.user?.display_name ?? "Unknown";
  const date = new Date(comment.created_at).toLocaleDateString();

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPosting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paperId, content: replyText, parent_id: comment.id }),
    });
    if (res.ok) { setReplyText(""); setReplying(false); onReply(); }
    setPosting(false);
  }

  async function handleVote(value: 1 | -1) {
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: comment.id, target_type: "comment", value }),
    });
    if (res.ok) setVote(vote === value ? null : value);
  }

  async function handleFlag() {
    const reason = prompt("Reason: ad_hominem | coercion | intimidation | other");
    if (!reason) return;
    await fetch("/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: comment.id, target_type: "comment", reason }),
    });
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l pl-4" : ""}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{author}</span>
          <span>{date}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        <div className="flex gap-3 text-xs text-muted-foreground pt-1">
          <button
            onClick={() => handleVote(1)}
            className={vote === 1 ? "text-foreground font-medium" : "hover:text-foreground"}
          >
            ↑
          </button>
          <button
            onClick={() => handleVote(-1)}
            className={vote === -1 ? "text-foreground font-medium" : "hover:text-foreground"}
          >
            ↓
          </button>
          {depth < 3 && (
            <button onClick={() => setReplying(!replying)} className="hover:text-foreground">
              Reply
            </button>
          )}
          <button onClick={handleFlag} className="hover:text-destructive">
            Flag
          </button>
        </div>
      </div>

      {replying && (
        <form onSubmit={handleReply} className="mt-2 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply..."
            rows={2}
            className="text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={posting || !replyText.trim()}>
              {posting ? "..." : "Reply"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setReplying(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={[]} // flat structure from API, no deeper nesting needed
          paperId={paperId}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
