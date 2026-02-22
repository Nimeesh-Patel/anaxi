"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ArxivPaper } from "@/lib/arxiv/api";

type Selection = {
  text: string;
  startOffset: number;
  endOffset: number;
  anchorId: string | null;
};

type Props = {
  paper: ArxivPaper;
  selection: Selection;
  position: { x: number; y: number };
  onClose: () => void;
};

export function AnnotationPopover({ paper, selection, position, onClose }: Props) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paper_id: paper.id,
        paper_version: paper.version,
        selected_text: selection.text,
        char_start: selection.startOffset,
        char_end: selection.endOffset,
        anchor_id: selection.anchorId,
        content: content.trim(),
      }),
    });

    if (res.status === 401) {
      setError("Sign in to annotate.");
    } else if (!res.ok) {
      setError("Failed to save annotation.");
    } else {
      onClose();
    }
    setSaving(false);
  }

  return (
    <div
      className="absolute z-50 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-3"
      style={{ left: position.x - 160, top: position.y }}
    >
      <div className="text-xs text-muted-foreground italic line-clamp-2 border-l-2 pl-2">
        &ldquo;{selection.text}&rdquo;
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Your annotation..."
          rows={3}
          className="text-sm"
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving || !content.trim()}>
            {saving ? "Saving..." : "Annotate"}
          </Button>
        </div>
      </form>
    </div>
  );
}
