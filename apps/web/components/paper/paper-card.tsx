import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ArxivPaper } from "@/lib/mcp";

export function PaperCard({ paper }: { paper: ArxivPaper }) {
  const date = new Date(paper.published);
  const formatted = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const authorList =
    paper.authors.length > 3
      ? `${paper.authors.slice(0, 3).join(", ")} et al.`
      : paper.authors.join(", ");

  return (
    <div className="py-5 space-y-2 group">
      <div className="flex gap-1 flex-wrap">
        {paper.categories.slice(0, 3).map((cat) => (
          <Badge key={cat} variant="secondary" className="text-xs">
            {cat}
          </Badge>
        ))}
      </div>
      <Link
        href={`/paper/${paper.id}`}
        className="font-semibold leading-snug text-base hover:text-primary transition-colors block"
      >
        {paper.title}
      </Link>
      <p className="text-xs text-muted-foreground">
        {authorList} · {formatted}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {paper.abstract}
      </p>
    </div>
  );
}
