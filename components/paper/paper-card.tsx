import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ArxivPaper } from "@/lib/arxiv/api";

export function PaperCard({ paper }: { paper: ArxivPaper }) {
  const year = new Date(paper.published).getFullYear();
  const authorList =
    paper.authors.length > 3
      ? `${paper.authors.slice(0, 3).join(", ")} et al.`
      : paper.authors.join(", ");

  return (
    <div className="py-4 space-y-1">
      <Link
        href={`/paper/${paper.id}`}
        className="font-medium hover:underline leading-snug"
      >
        {paper.title}
      </Link>
      <p className="text-xs text-muted-foreground">
        {authorList} · {year}
      </p>
      <p className="text-sm text-muted-foreground line-clamp-2">{paper.abstract}</p>
      <div className="flex gap-1 flex-wrap pt-1">
        {paper.categories.slice(0, 3).map((cat) => (
          <Badge key={cat} variant="secondary" className="text-xs">
            {cat}
          </Badge>
        ))}
      </div>
    </div>
  );
}
