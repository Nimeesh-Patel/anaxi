"use client";

// Renders arXiv HTML proxied through our server (same-origin iframe).
// Text selections inside the iframe are posted to the parent via postMessage.
// The AnnotationPopover listens and lets users create annotations.

import { useEffect, useRef, useState } from "react";
import type { ArxivPaper } from "@/lib/arxiv/api";
import { AnnotationPopover } from "@/components/annotations/annotation-popover";

type Selection = {
  text: string;
  startOffset: number;
  endOffset: number;
  anchorId: string | null;
};

type Props = { paper: ArxivPaper };

export function PaperHtml({ paper }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== "anaxi:selection") return;
      setSelection(e.data);
      const rect = iframeRef.current?.getBoundingClientRect();
      setPopoverPos({
        x: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
        y: (rect?.top ?? 0) + window.scrollY + 40,
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="relative">
      <iframe
        ref={iframeRef}
        src={`/api/paper/${paper.id}/html`}
        title={paper.title}
        className="w-full border rounded bg-white"
        style={{ height: "80vh" }}
      />
      {selection && (
        <AnnotationPopover
          paper={paper}
          selection={selection}
          position={popoverPos}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
