"use client";

import { useState, useEffect } from "react";
import type { ArxivPaper } from "@/lib/mcp";
import { PaperHtml } from "./paper-html";
import { PaperPdf } from "./paper-pdf";

type Props = { paper: ArxivPaper };

export function PaperViewer({ paper }: Props) {
  const [mode, setMode] = useState<"html" | "pdf">("html");
  const [htmlAvailable, setHtmlAvailable] = useState<boolean | null>(
    paper.hasHtml ? null : false // null = checking, false = unavailable
  );

  useEffect(() => {
    if (!paper.hasHtml) return;
    // Check if arXiv HTML version actually exists
    fetch(`https://arxiv.org/html/${paper.id}`, { method: "HEAD", mode: "no-cors" })
      .then(() => setHtmlAvailable(true))
      .catch(() => {
        setHtmlAvailable(false);
        setMode("pdf");
      });
  }, [paper.id, paper.hasHtml]);

  if (htmlAvailable === null) {
    return <p className="text-sm text-muted-foreground">Loading paper...</p>;
  }

  return (
    <div className="space-y-4">
      {htmlAvailable && (
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setMode("html")}
            className={mode === "html" ? "font-medium underline" : "text-muted-foreground hover:underline"}
          >
            HTML
          </button>
          <button
            onClick={() => setMode("pdf")}
            className={mode === "pdf" ? "font-medium underline" : "text-muted-foreground hover:underline"}
          >
            PDF
          </button>
        </div>
      )}

      {mode === "html" && htmlAvailable ? (
        <PaperHtml paper={paper} />
      ) : (
        <PaperPdf paper={paper} />
      )}
    </div>
  );
}
