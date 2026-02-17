// Proxies arXiv HTML through our origin so text selection + annotations work
// (cross-origin iframes block DOM access)
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`https://arxiv.org/html/${id}`, {
    headers: { "User-Agent": "Anaxi/1.0 (open science platform)" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let html = await res.text();

  // Fix relative URLs so assets load from arXiv
  html = html.replace(
    /<head>/i,
    `<head><base href="https://arxiv.org/html/${id}/" />`
  );

  // Inject annotation bridge script (posts text selections to parent)
  const annotationScript = `
<script>
(function() {
  document.addEventListener('mouseup', function() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text || text.length < 10) return;
    window.parent.postMessage({
      type: 'anaxi:selection',
      text,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      // Walk up to find a stable parent with id
      anchorId: range.startContainer.parentElement?.closest('[id]')?.id || null,
    }, '*');
  });
})();
</script>`;

  html = html.replace("</body>", `${annotationScript}</body>`);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
