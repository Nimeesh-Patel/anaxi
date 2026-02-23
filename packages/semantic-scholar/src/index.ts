// Semantic Scholar API client — shared by web app and MCP
// API docs: https://api.semanticscholar.org/api-docs/
// Pass SEMANTIC_SCHOLAR_API_KEY for 1 req/s rate (vs shared anonymous pool)

const SS_API = "https://api.semanticscholar.org/graph/v1";
const SS_RECS_API = "https://api.semanticscholar.org/recommendations/v1";

const PAPER_FIELDS =
  "paperId,externalIds,title,abstract,year,citationCount,influentialCitationCount,referenceCount,authors,venue,tldr,openAccessPdf,publicationDate,publicationTypes";

const SEARCH_FIELDS =
  "paperId,externalIds,title,abstract,year,citationCount,influentialCitationCount,authors,venue,tldr,publicationDate";

export type SemanticScholarPaper = {
  paperId: string;
  arxivId?: string;
  title: string;
  abstract?: string;
  year?: number;
  citationCount?: number;
  influentialCitationCount?: number;
  referenceCount?: number;
  authors: { authorId: string; name: string }[];
  venue?: string;
  tldr?: { text: string };
  openAccessPdfUrl?: string;
  publicationDate?: string;
  publicationTypes?: string[];
};

export type SemanticScholarAuthor = {
  authorId: string;
  name: string;
  url?: string;
  paperCount?: number;
  hIndex?: number;
  papers?: { paperId: string; title: string }[];
};

function buildHeaders(userAgent: string, apiKey?: string): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": userAgent };
  if (apiKey) h["x-api-key"] = apiKey;
  return h;
}

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
    influentialCitationCount: raw.influentialCitationCount as number | undefined,
    referenceCount: raw.referenceCount as number | undefined,
    authors: ((raw.authors ?? []) as { authorId: string; name: string }[]),
    venue: raw.venue as string | undefined,
    tldr: raw.tldr as { text: string } | undefined,
    openAccessPdfUrl: openAccessPdf?.url,
    publicationDate: raw.publicationDate as string | undefined,
    publicationTypes: raw.publicationTypes as string[] | undefined,
  };
}

export async function getPaper(
  arxivId: string,
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<SemanticScholarPaper | null> {
  const url = `${SS_API}/paper/arXiv:${arxivId}?fields=${PAPER_FIELDS}`;
  const res = await fetch(url, { headers: buildHeaders(userAgent, apiKey) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  return mapPaper(await res.json());
}

// Uses bulk search endpoint (same ranker as relevance search, more efficient)
export async function search(
  query: string,
  limit = 10,
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<{ papers: SemanticScholarPaper[]; total: number; token?: string }> {
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(limit, 100)),
    fields: SEARCH_FIELDS,
  });
  const res = await fetch(`${SS_API}/paper/search/bulk?${params}`, {
    headers: buildHeaders(userAgent, apiKey),
  });
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json();
  return {
    papers: ((data.data ?? []) as Record<string, unknown>[]).map(mapPaper),
    total: data.total ?? 0,
    token: data.token,
  };
}

export async function getReferences(
  arxivId: string,
  limit = 20,
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    fields: SEARCH_FIELDS,
    limit: String(Math.min(limit, 100)),
  });
  const url = `${SS_API}/paper/arXiv:${arxivId}/references?${params}`;
  const res = await fetch(url, { headers: buildHeaders(userAgent, apiKey) });
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
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    fields: SEARCH_FIELDS,
    limit: String(Math.min(limit, 100)),
  });
  const url = `${SS_API}/paper/arXiv:${arxivId}/citations?${params}`;
  const res = await fetch(url, { headers: buildHeaders(userAgent, apiKey) });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json();
  return ((data.data ?? []) as { citingPaper: Record<string, unknown> }[]).map(
    (r) => mapPaper(r.citingPaper)
  );
}

// Recommend papers based on positive/negative seed paper IDs (Semantic Scholar IDs)
export async function getRecommendations(
  positivePaperIds: string[],
  negativePaperIds: string[] = [],
  limit = 20,
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    fields: SEARCH_FIELDS,
    limit: String(Math.min(limit, 500)),
  });
  const res = await fetch(`${SS_RECS_API}/papers?${params}`, {
    method: "POST",
    headers: { ...buildHeaders(userAgent, apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({ positivePaperIds, negativePaperIds }),
  });
  if (!res.ok) throw new Error(`Semantic Scholar Recommendations API error: ${res.status}`);
  const data = await res.json();
  return ((data.recommendedPapers ?? []) as Record<string, unknown>[]).map(mapPaper);
}

// Batch fetch papers by Semantic Scholar paper IDs or arXiv IDs (arXiv:XXXX format)
export async function batchGetPapers(
  paperIds: string[],
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({ fields: PAPER_FIELDS });
  const res = await fetch(`${SS_API}/paper/batch?${params}`, {
    method: "POST",
    headers: { ...buildHeaders(userAgent, apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({ ids: paperIds }),
  });
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = (await res.json()) as (Record<string, unknown> | null)[];
  return data.filter(Boolean).map((p) => mapPaper(p as Record<string, unknown>));
}

export async function getAuthor(
  authorId: string,
  userAgent = "Anaxi/1.0",
  apiKey?: string
): Promise<SemanticScholarAuthor | null> {
  const fields = "name,url,paperCount,hIndex,papers";
  const url = `${SS_API}/author/${authorId}?fields=${fields}`;
  const res = await fetch(url, { headers: buildHeaders(userAgent, apiKey) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const raw = await res.json();
  return {
    authorId: raw.authorId,
    name: raw.name,
    url: raw.url,
    paperCount: raw.paperCount,
    hIndex: raw.hIndex,
    papers: raw.papers,
  };
}
