const GRAPH_API_BASE = "https://api.semanticscholar.org/graph/v1";
const RECOMMENDATIONS_API_BASE = "https://api.semanticscholar.org/recommendations/v1";
const DATASETS_API_BASE = "https://api.semanticscholar.org/datasets/v1";

const DEFAULT_PAPER_FIELDS = [
  "paperId",
  "externalIds",
  "title",
  "abstract",
  "year",
  "url",
  "citationCount",
  "influentialCitationCount",
  "referenceCount",
  "authors",
  "venue",
  "publicationDate",
  "openAccessPdf",
];

const DEFAULT_AUTHOR_FIELDS = [
  "authorId",
  "name",
  "url",
  "paperCount",
  "citationCount",
  "hIndex",
  "papers.paperId",
  "papers.title",
  "papers.year",
];

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

type RequestOptions = {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(message: string, status?: number): ToolResult {
  return ok({ error: message, status, retryable: status === 429 || (status !== undefined && status >= 500) });
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Anaxi-MCP/1.0",
  };
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(path: string, options: RequestOptions = {}): Promise<unknown> {
  const url = new URL(path);
  for (const [k, v] of Object.entries(options.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const retries = 3;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: getHeaders(),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 429 && attempt < retries - 1) {
      const backoffMs = 250 * 2 ** attempt;
      await sleep(backoffMs);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(JSON.stringify({ status: response.status, text: text.slice(0, 500) }));
    }

    return response.json();
  }

  throw new Error(JSON.stringify({ status: 429, text: "Rate limited after retries" }));
}

function parseApiError(error: unknown): { status?: number; message: string } {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { status?: number; text?: string };
      if (parsed?.status) {
        return {
          status: parsed.status,
          message: parsed.text ? `Semantic Scholar request failed (${parsed.status}): ${parsed.text}` : `Semantic Scholar request failed (${parsed.status})`,
        };
      }
    } catch {
      return { message: error.message };
    }
    return { message: error.message };
  }
  return { message: "Unknown Semantic Scholar error" };
}

function cleanPaper(raw: Record<string, unknown>) {
  const externalIds = (raw.externalIds ?? {}) as Record<string, string>;
  const openAccessPdf = (raw.openAccessPdf ?? null) as { url?: string } | null;
  const authors = Array.isArray(raw.authors)
    ? (raw.authors as { authorId?: string; name?: string }[]).map((a) => ({
        authorId: a.authorId ?? null,
        name: a.name ?? "",
      }))
    : [];

  return {
    paperId: raw.paperId ?? null,
    title: raw.title ?? "",
    abstract: raw.abstract ?? null,
    year: raw.year ?? null,
    url: raw.url ?? null,
    citationCount: raw.citationCount ?? 0,
    influentialCitationCount: raw.influentialCitationCount ?? 0,
    referenceCount: raw.referenceCount ?? 0,
    venue: raw.venue ?? null,
    publicationDate: raw.publicationDate ?? null,
    externalIds,
    openAccessPdfUrl: openAccessPdf?.url ?? null,
    authors,
  };
}

export async function searchPapers(
  query: string,
  limit = 10,
  offset = 0,
  fields = DEFAULT_PAPER_FIELDS
): Promise<ToolResult> {
  try {
    const data = (await requestJson(`${GRAPH_API_BASE}/paper/search`, {
      query: {
        query,
        limit: Math.min(Math.max(limit, 1), 100),
        offset: Math.max(offset, 0),
        fields: fields.join(","),
      },
    })) as { total?: number; next?: number; data?: Record<string, unknown>[] };

    return ok({
      query,
      total: data.total ?? 0,
      next: data.next ?? null,
      papers: (data.data ?? []).map(cleanPaper),
    });
  } catch (error) {
    const parsed = parseApiError(error);
    return err(parsed.message, parsed.status);
  }
}

export async function getPaperById(
  paperId: string,
  fields = DEFAULT_PAPER_FIELDS
): Promise<ToolResult> {
  try {
    const data = (await requestJson(`${GRAPH_API_BASE}/paper/${encodeURIComponent(paperId)}`, {
      query: { fields: fields.join(",") },
    })) as Record<string, unknown>;

    return ok({ paper: cleanPaper(data) });
  } catch (error) {
    const parsed = parseApiError(error);
    return err(parsed.message, parsed.status);
  }
}

export async function getAuthorById(
  authorId: string,
  fields = DEFAULT_AUTHOR_FIELDS
): Promise<ToolResult> {
  try {
    const data = (await requestJson(`${GRAPH_API_BASE}/author/${encodeURIComponent(authorId)}`, {
      query: { fields: fields.join(",") },
    })) as Record<string, unknown>;

    return ok({
      author: {
        authorId: data.authorId ?? null,
        name: data.name ?? "",
        url: data.url ?? null,
        paperCount: data.paperCount ?? 0,
        citationCount: data.citationCount ?? 0,
        hIndex: data.hIndex ?? 0,
        papers: Array.isArray(data.papers)
          ? (data.papers as Record<string, unknown>[]).map((paper) => ({
              paperId: paper.paperId ?? null,
              title: paper.title ?? "",
              year: paper.year ?? null,
            }))
          : [],
      },
    });
  } catch (error) {
    const parsed = parseApiError(error);
    return err(parsed.message, parsed.status);
  }
}

export async function getRecommendationsByPaperIds(
  positivePaperIds: string[],
  negativePaperIds: string[] = [],
  limit = 20,
  fields = DEFAULT_PAPER_FIELDS
): Promise<ToolResult> {
  try {
    const data = (await requestJson(`${RECOMMENDATIONS_API_BASE}/papers`, {
      method: "POST",
      query: {
        fields: fields.join(","),
        limit: Math.min(Math.max(limit, 1), 100),
      },
      body: { positivePaperIds, negativePaperIds },
    })) as { recommendedPapers?: Record<string, unknown>[] };

    return ok({
      input: { positivePaperIds, negativePaperIds },
      papers: (data.recommendedPapers ?? []).map(cleanPaper),
    });
  } catch (error) {
    const parsed = parseApiError(error);
    return err(parsed.message, parsed.status);
  }
}

export async function listDatasets(): Promise<ToolResult> {
  try {
    const data = await requestJson(`${DATASETS_API_BASE}/release`);
    return ok({ releases: data });
  } catch (error) {
    const parsed = parseApiError(error);
    return err(parsed.message, parsed.status);
  }
}

export async function getDatasetDetails(releaseId: string, datasetName: string): Promise<ToolResult> {
  try {
    const data = await requestJson(
      `${DATASETS_API_BASE}/release/${encodeURIComponent(releaseId)}/dataset/${encodeURIComponent(datasetName)}`
    );
    return ok({ releaseId, dataset: datasetName, details: data });
  } catch (error) {
    const parsed = parseApiError(error);
    return err(parsed.message, parsed.status);
  }
}
