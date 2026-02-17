import { searchPapers } from "@/lib/arxiv/api";
import { SearchBar } from "@/components/search-bar";
import { PaperCard } from "@/components/paper/paper-card";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const query = q?.trim();
  const currentPage = parseInt(page ?? "1");
  const pageSize = 10;
  const start = (currentPage - 1) * pageSize;

  const result = query
    ? await searchPapers(query, start, pageSize).catch(() => null)
    : null;

  const totalPages = result ? Math.ceil(Math.min(result.total, 1000) / pageSize) : 1;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Discover Papers</h1>
        <p className="text-sm text-muted-foreground">
          Search arXiv. Annotate. Criticise.
        </p>
      </div>

      <SearchBar defaultValue={query} />

      {!query && (
        <p className="text-sm text-muted-foreground">
          Search for a topic, author, or arXiv ID to get started.
        </p>
      )}

      {result && result.papers.length === 0 && (
        <p className="text-sm text-muted-foreground">No papers found for &ldquo;{query}&rdquo;.</p>
      )}

      {result && result.papers.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {result.total.toLocaleString()} results
          </p>
          <div className="divide-y">
            {result.papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex gap-4 items-center justify-center pt-4">
              {currentPage > 1 && (
                <a
                  href={`/?q=${encodeURIComponent(query!)}&page=${currentPage - 1}`}
                  className="text-sm underline"
                >
                  Previous
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <a
                  href={`/?q=${encodeURIComponent(query!)}&page=${currentPage + 1}`}
                  className="text-sm underline"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
