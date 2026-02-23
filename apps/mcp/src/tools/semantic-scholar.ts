import {
  search,
  getPaper,
  getReferences,
  getCitations,
} from "@anaxi/semantic-scholar";
import * as cache from "../services/cache.js";

const UA = "Anaxi-MCP/1.0";

export async function searchPapers(
  query: string,
  limit = 10
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const cacheKey = `ss:search:${query}:${limit}`;
  const cached = cache.get<{ papers: unknown[]; total: number }>(cacheKey);
  if (cached) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }],
    };
  }
  const result = await search(query, limit, UA);
  cache.set(cacheKey, result, 300);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

export async function getPaperByArxivId(
  arxivId: string
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const cacheKey = `ss:paper:${arxivId}`;
  let paper = cache.get<Awaited<ReturnType<typeof getPaper>>>(cacheKey);
  if (!paper) {
    paper = await getPaper(arxivId, UA);
    if (paper) cache.set(cacheKey, paper, 3600);
  }
  if (!paper) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Paper '${arxivId}' not found on Semantic Scholar.`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(paper, null, 2) }],
  };
}

export async function getRefs(
  arxivId: string,
  limit = 20
): Promise<{ content: { type: "text"; text: string }[] }> {
  const refs = await getReferences(arxivId, limit, UA);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(refs, null, 2) }],
  };
}

export async function getCites(
  arxivId: string,
  limit = 20
): Promise<{ content: { type: "text"; text: string }[] }> {
  const cites = await getCitations(arxivId, limit, UA);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(cites, null, 2) }],
  };
}
