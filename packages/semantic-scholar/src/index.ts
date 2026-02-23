// Semantic Scholar API client — shared by web app and MCP
// API docs: https://api.semanticscholar.org/api-docs/
// No API key needed for basic usage (rate limited ~100 req/5min)

const SS_API = "https://api.semanticscholar.org/graph/v1";

const PAPER_FIELDS =
  "paperId,externalIds,title,abstract,year,citationCount,referenceCount,authors,venue,tldr,openAccessPdf";

const SEARCH_FIELDS =
  "paperId,externalIds,title,abstract,year,citationCount,authors,venue,tldr";

export type SemanticScholarPaper = {
  paperId: string;
  arxivId?: string;
  title: string;
  abstract?: string;
  year?: number;
  citationCount?: number;
  referenceCount?: number;
  authors: { authorId: string; name: string }[];
  venue?: string;
  tldr?: { text: string };
  openAccessPdfUrl?: string;
};

function mapPaper(raw: Record<string, unknown>): SemanticScholarPaper {
  const externalIds = (raw.externalIds ?? {}) as Record<string, string>;
  const openAccessPdf = raw.openAccessPdf as { url?: string } | null;
  return {
    paperId: raw.paperId as string,
    arxivId: externalIds["ArXiv"],
    title: (raw.title as string) ?? "",
    abstract: raw.abstract as string | undefined,
    year: raw.year as number | undefined,
    citationCount: raw.citationCount as number | undefined,
    referenceCount: raw.referenceCount as number | undefined,
    authors: ((raw.authors ?? []) as { authorId: string; name: string }[]),
    venue: raw.venue as string | undefined,
    tldr: raw.tldr as { text: string } | undefined,
    openAccessPdfUrl: openAccessPdf?.url,
  };
}

export async function getPaper(
  arxivId: string,
  userAgent = "Anaxi/1.0"
): Promise<SemanticScholarPaper | null> {
  const url = `${SS_API}/paper/arXiv:${arxivId}?fields=${PAPER_FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  return mapPaper(await res.json());
}

export async function search(
  query: string,
  limit = 10,
  userAgent = "Anaxi/1.0"
): Promise<{ papers: SemanticScholarPaper[]; total: number }> {
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(limit, 100)),
    fields: SEARCH_FIELDS,
  });
  const res = await fetch(`${SS_API}/paper/search?${params}`, {
    headers: { "User-Agent": userAgent },
  });
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json();
  return {
    papers: ((data.data ?? []) as Record<string, unknown>[]).map(mapPaper),
    total: data.total ?? 0,
  };
}

export async function getReferences(
  arxivId: string,
  limit = 20,
  userAgent = "Anaxi/1.0"
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    fields: SEARCH_FIELDS,
    limit: String(Math.min(limit, 100)),
  });
  const url = `${SS_API}/paper/arXiv:${arxivId}/references?${params}`;
  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json();
  return ((data.data ?? []) as { citedPaper: Record<string, unknown> }[]).map(
    (r) => mapPaper(r.citedPaper)
  );
}

export async function getCitations(
  arxivId: string,
  limit = 20,
  userAgent = "Anaxi/1.0"
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    fields: SEARCH_FIELDS,
    limit: String(Math.min(limit, 100)),
  });
  const url = `${SS_API}/paper/arXiv:${arxivId}/citations?${params}`;
  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json();
  return ((data.data ?? []) as { citingPaper: Record<string, unknown> }[]).map(
    (r) => mapPaper(r.citingPaper)
  );
}
