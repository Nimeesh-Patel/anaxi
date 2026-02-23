import { notFound } from "next/navigation";
import { getPaper } from "@/lib/mcp";
import { PaperViewer } from "@/components/paper/paper-viewer";
import { DiscussionSection } from "@/components/discussion/discussion-section";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ id: string }> };

export default async function PaperPage({ params }: Props) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();

  const year = new Date(paper.published).getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          {paper.categories.slice(0, 4).map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <h1 className="text-2xl font-semibold leading-snug">{paper.title}</h1>
        <p className="text-sm text-muted-foreground">
          {paper.authors.join(", ")} · {year}
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <a
            href={`https://arxiv.org/abs/${paper.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            arXiv:{paper.id}
          </a>
          <span>v{paper.version}</span>
        </div>
      </div>

      {/* Abstract */}
      <div className="bg-muted/40 rounded p-4 text-sm leading-relaxed">
        <span className="font-medium">Abstract. </span>
        {paper.abstract}
      </div>

      {/* Paper body + annotation sidebar */}
      <PaperViewer paper={paper} />

      {/* Discussion */}
      <DiscussionSection paperId={paper.id} />
    </div>
  );
}
