"use client";

import type { ArxivPaper } from "@/lib/arxiv/api";

type Props = { paper: ArxivPaper };

export function PaperPdf({ paper }: Props) {
  const pdfUrl = `https://arxiv.org/pdf/${paper.id}`;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        HTML version not available for this paper. Showing PDF.
        Annotations require the HTML version.
      </p>
      <iframe
        src={pdfUrl}
        title={paper.title}
        className="w-full border rounded"
        style={{ height: "80vh" }}
      />
    </div>
  );
}
